import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getRoomNotionClient, normalizePageId } from "@/lib/notion-room/server";

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getEntityId(payload: unknown) {
  const entity = readRecord(readRecord(payload).entity);
  return readString(entity.id);
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
  const pageTitle = getChangedPageTitle(payload);

  const supabase = createClient(url, key);
  const channel = supabase.channel(`room-${roomId}`);
  await channel.send({
    type: "broadcast",
    event: "notion-room-refresh",
    payload: {
      roomId,
      entityId,
      pageTitle,
      timestamp: new Date().toISOString(),
    },
  });
  await supabase.removeChannel(channel);

  return NextResponse.json({ ok: true, broadcasted: true });
}
