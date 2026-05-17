import type { Client as NotionClient } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  extractPageTitle,
  getRoomNotionClient,
  normalizePageId,
} from "@/lib/notion-room/server";

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getEntityId(payload: unknown) {
  const root = readRecord(payload);
  const data = readRecord(root.data);
  const entity = readRecord(root.entity);
  return readString(data.id) || readString(entity.id);
}

function getEntityType(payload: unknown) {
  const root = readRecord(payload);
  const data = readRecord(root.data);
  const entity = readRecord(root.entity);
  return (
    readString(data.object) ||
    readString(data.type) ||
    readString(entity.object) ||
    readString(entity.type)
  );
}

function getWebhookEventType(payload: unknown) {
  return (
    readString(readRecord(payload).type) ||
    readString(readRecord(payload).event)
  );
}

function formatEventAction(eventType: string | null): string {
  if (!eventType) return "Activity";
  const parts = eventType.split(".");
  const action = parts[parts.length - 1]; // e.g. "content_updated", "created"
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSnippetFromPayload(payload: unknown): string | null {
  const root = readRecord(payload);
  const data = readRecord(root.data);
  const entity = readRecord(root.entity);

  // Try data first, then entity
  for (const obj of [data, entity]) {
    const type = readString(obj.type) || readString(obj.object);
    if (type && typeof type === "string") {
      const typeObj = readRecord(obj[type]);
      if (Array.isArray(typeObj.rich_text)) {
        const text = typeObj.rich_text
          .map((part: unknown) => {
            const p = readRecord(part);
            return typeof p.plain_text === "string" ? p.plain_text : "";
          })
          .join("")
          .trim();
        if (text) {
          return text.length > 60 ? text.slice(0, 57) + "..." : text;
        }
      }
    }
  }
  return null;
}

function getBlockSnippet(block: unknown): string | null {
  const b = readRecord(block);
  const type = readString(b.type);
  if (!type) return null;

  const value = readRecord(b[type]);
  if (value && "rich_text" in value && Array.isArray(value.rich_text)) {
    const text = value.rich_text
      .map((part: unknown) => {
        const p = readRecord(part);
        return typeof p.plain_text === "string" ? p.plain_text : "";
      })
      .join("")
      .trim();
    if (text) {
      return text.length > 60 ? text.slice(0, 57) + "..." : text;
    }
  }

  return null;
}

async function getParentPageTitle(
  notion: NotionClient,
  parentId: string,
  parentType: string,
  depth = 0,
): Promise<string | null> {
  if (depth > 3) return null;
  try {
    if (parentType === "page_id") {
      const page = await notion.pages.retrieve({ page_id: parentId });
      if ("properties" in page) {
        return extractPageTitle(page.properties);
      }
    } else if (parentType === "database_id") {
      const db = await notion.databases.retrieve({ database_id: parentId });
      if ("title" in db && Array.isArray(db.title)) {
        const firstTitle = readRecord(db.title[0]);
        if (typeof firstTitle.plain_text === "string") {
          return firstTitle.plain_text;
        }
      }
    } else if (parentType === "block_id") {
      const block = await notion.blocks.retrieve({ block_id: parentId });
      if ("parent" in block && block.parent) {
        return getParentPageTitle(
          notion,
          block.parent[block.parent.type],
          block.parent.type,
          depth + 1,
        );
      }
    }
  } catch (err) {
    console.error("Error fetching parent description:", err);
  }
  return null;
}

async function fetchWebhookDetailedInfo(
  entityId: string,
  entityType: string | null,
  eventType: string | null,
  payload: unknown,
) {
  let rawTitle = "";
  let parentTitle: string | null = null;
  let snippet: string | null = getSnippetFromPayload(payload);

  try {
    const notion = getRoomNotionClient();

    if (entityType === "page") {
      const page = await notion.pages.retrieve({ page_id: entityId });
      if ("properties" in page) {
        rawTitle = extractPageTitle(page.properties);
      }
      if (!rawTitle) rawTitle = "Unnamed Page";
    } else if (entityType === "database") {
      const db = await notion.databases.retrieve({ database_id: entityId });
      if ("title" in db && Array.isArray(db.title)) {
        const firstTitle = readRecord(db.title[0]);
        if (typeof firstTitle.plain_text === "string") {
          rawTitle = firstTitle.plain_text;
        }
      }
      if (!rawTitle) rawTitle = "Unnamed Database";
    } else if (entityType === "block") {
      const block = await notion.blocks.retrieve({ block_id: entityId });
      let blockType = "Block";
      if ("type" in block) {
        blockType = block.type;
        if (!snippet) {
          snippet = getBlockSnippet(block);
        }
      }
      rawTitle = `Block (${blockType})`;

      if ("parent" in block && block.parent) {
        parentTitle = await getParentPageTitle(
          notion,
          block.parent[block.parent.type],
          block.parent.type,
        );
      }
    } else if (entityType === "comment") {
      rawTitle = "Comment";
      const root = readRecord(payload);
      const data = readRecord(root.data);
      if (data.parent && typeof data.parent === "object") {
        const p = readRecord(data.parent);
        if (p.type === "page_id" && p.page_id) {
          try {
            const parentPage = await notion.pages.retrieve({
              page_id: String(p.page_id),
            });
            if ("properties" in parentPage) {
              parentTitle = extractPageTitle(parentPage.properties);
            }
          } catch {}
        }
      }
    } else {
      rawTitle = entityType
        ? entityType.charAt(0).toUpperCase() + entityType.slice(1)
        : "Workspace";
    }
  } catch (err) {
    console.error("Error fetching detailed entity info from Notion:", err);
    rawTitle = entityType
      ? entityType.charAt(0).toUpperCase() + entityType.slice(1)
      : "Notion";
  }

  let pageTitle = "";
  if (entityType === "block" && parentTitle) {
    pageTitle = `${rawTitle} in "${parentTitle}"`;
  } else if (entityType === "comment" && parentTitle) {
    pageTitle = `Comment on "${parentTitle}"`;
  } else {
    pageTitle = rawTitle;
  }

  return {
    rawTitle,
    parentTitle,
    snippet,
    pageTitle,
  };
}

function getChangedPageTitle(payload: unknown) {
  const root = readRecord(payload);
  const data = readRecord(root.data);
  const properties = readRecord(data.properties);
  // Notion uses "Name" or "title" or similar for the page title property
  for (const propValue of Object.values(properties)) {
    const propRecord = readRecord(propValue);
    if (propRecord.type === "title" && Array.isArray(propRecord.title)) {
      const firstTitle = readRecord(propRecord.title[0]);
      if (typeof firstTitle.plain_text === "string") {
        return firstTitle.plain_text;
      }
    }
  }

  // Also try common fields
  const entity = readRecord(root.entity);
  if (typeof entity.title === "string") return entity.title;
  if (typeof root.title === "string") return root.title;
  if (typeof data.title === "string") return data.title;

  return null;
}

async function resolveRoomId(
  payload: unknown,
  supabaseUrl?: string,
  supabaseKey?: string,
) {
  const root = readRecord(payload);
  const data = readRecord(root.data);
  const dataParent = readRecord(data.parent);
  const entity = readRecord(root.entity);

  const candidates: string[] = [];
  if (root.roomId) candidates.push(readString(root.roomId) || "");
  if (root.page_id) candidates.push(readString(root.page_id) || "");
  if (dataParent.id) candidates.push(readString(dataParent.id) || "");
  if (entity.id) candidates.push(readString(entity.id) || "");
  if (data.id) candidates.push(readString(data.id) || "");

  const uniqueCandidates = Array.from(
    new Set(candidates.filter(Boolean).map(normalizePageId)),
  );

  let registeredRooms: string[] = [];
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: rooms } = await supabase.from("notion_rooms").select("id");
      if (rooms) {
        registeredRooms = rooms.map((r) => normalizePageId(r.id));
      }
    } catch (e) {
      console.error("Failed to fetch registered rooms from Supabase:", e);
    }
  }

  const notion = getRoomNotionClient();

  for (const candidateId of uniqueCandidates) {
    let currentId = candidateId;
    for (let depth = 0; depth < 4; depth++) {
      if (registeredRooms.includes(currentId)) {
        return currentId;
      }

      try {
        const page = await notion.pages.retrieve({ page_id: currentId });
        if ("parent" in page && page.parent) {
          const parent = page.parent;
          if (parent.type === "page_id" && parent.page_id) {
            currentId = normalizePageId(parent.page_id);
            continue;
          } else if (parent.type === "database_id" && parent.database_id) {
            currentId = normalizePageId(parent.database_id);
            continue;
          }
        }
      } catch {
        try {
          const block = await notion.blocks.retrieve({ block_id: currentId });
          if ("parent" in block && block.parent) {
            const parent = block.parent;
            if (parent.type === "page_id" && parent.page_id) {
              currentId = normalizePageId(parent.page_id);
              continue;
            } else if (parent.type === "block_id" && parent.block_id) {
              currentId = normalizePageId(parent.block_id);
              continue;
            }
          }
        } catch {
          break;
        }
      }
      break;
    }
  }

  // Fallback
  for (const id of uniqueCandidates) {
    try {
      const page = await notion.pages.retrieve({ page_id: id });
      if ("parent" in page && page.parent) {
        const parent = page.parent;
        if (parent.type === "page_id" && parent.page_id) {
          return normalizePageId(parent.page_id);
        }
      }
    } catch {
      // Ignore
    }
  }

  return uniqueCandidates[0] || null;
}

export function handleNotionRoomWebhookHealthcheck() {
  return NextResponse.json({
    ok: true,
    endpoint: "notion-room-webhook",
  });
}

export async function handleNotionRoomWebhook(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const verificationToken = readString(readRecord(payload).verification_token);
  if (verificationToken) {
    console.warn("Notion webhook verification_token:", verificationToken);
    return NextResponse.json({
      ok: true,
      verification_token: verificationToken,
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const roomId = await resolveRoomId(payload, url, key).catch(() => null);

  if (!roomId || !url || !key) {
    return NextResponse.json({
      ok: true,
      broadcasted: false,
      reason: "Missing roomId or Supabase env",
    });
  }

  const entityId =
    getEntityId(payload) ?? readString(readRecord(readRecord(payload).data).id);
  const entityType = getEntityType(payload);
  const eventType = getWebhookEventType(payload);

  const actionLabel = formatEventAction(eventType);
  let detailedInfo = {
    pageTitle: getChangedPageTitle(payload),
    rawTitle: getChangedPageTitle(payload) || "Unnamed Page",
    parentTitle: null as string | null,
    snippet: getSnippetFromPayload(payload),
  };

  if (
    (!detailedInfo.pageTitle || detailedInfo.pageTitle === "Unnamed Page") &&
    entityId
  ) {
    detailedInfo = await fetchWebhookDetailedInfo(
      entityId,
      entityType,
      eventType,
      payload,
    );
  } else if (entityId && entityType === "block") {
    const fetched = await fetchWebhookDetailedInfo(
      entityId,
      entityType,
      eventType,
      payload,
    );
    detailedInfo = { ...detailedInfo, ...fetched };
  }

  if (!detailedInfo.pageTitle) {
    detailedInfo.pageTitle = detailedInfo.rawTitle || "Unnamed Notion Page";
  }

  const supabase = createClient(url, key);
  const channel = supabase.channel(`room-${roomId}`);

  await new Promise<void>((resolve) => {
    // Timeout to ensure the serverless function does not hang
    const timeout = setTimeout(() => {
      console.error("Supabase Realtime subscription timeout for broadcast.");
      supabase.removeChannel(channel);
      resolve();
    }, 5000);

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        try {
          await channel.send({
            type: "broadcast",
            event: "notion-room-refresh",
            payload: {
              roomId,
              entityId,
              entityType,
              eventType,
              actionLabel,
              pageTitle: detailedInfo.pageTitle,
              rawTitle: detailedInfo.rawTitle,
              snippet: detailedInfo.snippet,
              parentTitle: detailedInfo.parentTitle,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (e) {
          console.error("Failed to send broadcast:", e);
        } finally {
          await supabase.removeChannel(channel);
          resolve();
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timeout);
        console.error(`Broadcast failed with status: ${status}`);
        await supabase.removeChannel(channel);
        resolve();
      }
    });
  });

  return NextResponse.json({ ok: true, broadcasted: true });
}
