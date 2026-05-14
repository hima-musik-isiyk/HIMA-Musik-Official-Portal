import { Client } from "@notionhq/client";

import type {
  NotionRoomPage,
  NotionRoomPageType,
} from "@/lib/notion-room/types";

const notionVersion = "2026-03-11";
const roomIdPattern =
  /^[0-9a-fA-F]{32}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type NotionRichText = Array<{ plain_text: string; href?: string | null }>;

export function normalizePageId(value: string) {
  return value.trim().replaceAll("-", "");
}

export function assertValidPageId(value: string) {
  if (!roomIdPattern.test(value.trim())) {
    throw new Error("Invalid Notion page ID.");
  }
}

export function getRoomNotionClient() {
  const token =
    process.env.NOTION_TOKEN ?? process.env.NOTION_INTEGRATION_TOKEN ?? "";
  if (!token) {
    throw new Error("Missing NOTION_TOKEN or NOTION_INTEGRATION_TOKEN.");
  }

  return new Client({ auth: token, notionVersion });
}

function richTextToPlainText(richText?: NotionRichText) {
  return richText?.map((part) => part.plain_text).join("") ?? "";
}

function parseNumber(title: string) {
  const match = title.match(/^(\d{1,4})\b/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseType(title: string) {
  return title.replace(/^\d{1,4}\s*/, "").split(/\s+/)[0] || "Page";
}

export async function listRoomPages(roomId: string): Promise<NotionRoomPage[]> {
  assertValidPageId(roomId);

  const notion = getRoomNotionClient();
  const pages: NotionRoomPage[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: roomId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if ("type" in block && block.type === "child_page") {
        const title = block.child_page.title;
        pages.push({
          id: block.id,
          title,
          createdTime: block.created_time,
          number: parseNumber(title),
          type: parseType(title),
        });
      }
    }

    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  return pages.sort((a, b) => {
    if (a.number !== null && b.number !== null) return a.number - b.number;
    if (a.number !== null) return -1;
    if (b.number !== null) return 1;
    return a.createdTime.localeCompare(b.createdTime);
  });
}

async function listBlocksRecursive(
  notion: Client,
  blockId: string,
  depth = 0,
): Promise<string[]> {
  const lines: string[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if (!("type" in block)) continue;
      const line = blockToMarkdown(block, depth);
      if (line) lines.push(line);

      if ("has_children" in block && block.has_children) {
        lines.push(...(await listBlocksRecursive(notion, block.id, depth + 1)));
      }
    }

    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  return lines;
}

function blockToMarkdown(
  block: { type: string; id: string } & Record<string, unknown>,
  depth: number,
) {
  const indent = "  ".repeat(depth);
  const value =
    block[block.type] && typeof block[block.type] === "object"
      ? (block[block.type] as Record<string, unknown>)
      : {};
  const text = richTextToPlainText(
    value.rich_text as NotionRichText | undefined,
  );

  switch (block.type) {
    case "paragraph":
      return text ? `${indent}${text}` : "";
    case "heading_1":
      return `${indent}# ${text}`;
    case "heading_2":
      return `${indent}## ${text}`;
    case "heading_3":
      return `${indent}### ${text}`;
    case "bulleted_list_item":
      return `${indent}- ${text}`;
    case "numbered_list_item":
      return `${indent}1. ${text}`;
    case "to_do":
      return `${indent}- [${value?.checked ? "x" : " "}] ${text}`;
    case "toggle":
      return `${indent}<details><summary>${text}</summary>`;
    case "quote":
      return `${indent}> ${text}`;
    case "callout":
      return `${indent}> ${text}`;
    case "code":
      return `${indent}\`\`\`${value?.language ?? ""}\n${text}\n${indent}\`\`\``;
    case "divider":
      return `${indent}---`;
    case "child_page":
      return `${indent}# ${value?.title ?? "Untitled"}`;
    case "image":
    case "file":
    case "pdf":
      return `${indent}[${block.type}: ${getBlockAssetLabel(value) ?? block.id}]`;
    case "bookmark":
    case "embed":
    case "link_preview":
      return `${indent}${value?.url ?? ""}`;
    default:
      return text ? `${indent}${text}` : "";
  }
}

function getBlockAssetLabel(value: Record<string, unknown>) {
  const caption = Array.isArray(value.caption)
    ? (value.caption[0] as { plain_text?: string } | undefined)?.plain_text
    : undefined;
  const external = readNestedString(value.external, "url");
  const file = readNestedString(value.file, "url");
  return caption ?? external ?? file;
}

function readNestedString(value: unknown, key: string) {
  if (!value || typeof value !== "object") return undefined;
  const nested = value as Record<string, unknown>;
  return typeof nested[key] === "string" ? nested[key] : undefined;
}

export async function compilePages(pageIds: string[]) {
  const notion = getRoomNotionClient();
  const chunks: string[] = [];

  for (const pageId of pageIds) {
    assertValidPageId(pageId);
    const page = await notion.pages.retrieve({ page_id: pageId });
    const title =
      "properties" in page ? extractPageTitle(page.properties) : pageId;
    const body = (await listBlocksRecursive(notion, pageId)).join("\n");
    chunks.push(`## ${title}\n\n${body}`.trim());
  }

  return chunks.join("\n\n---\n\n");
}

function extractPageTitle(properties: Record<string, unknown>) {
  for (const property of Object.values(properties)) {
    if (
      property &&
      typeof property === "object" &&
      (property as { type?: string }).type === "title"
    ) {
      const title = richTextToPlainText(
        (property as { title?: NotionRichText }).title,
      );
      if (title) return title;
    }
  }

  return "Untitled";
}

export async function createRoomPage({
  roomId,
  pageType,
  referenceIds = [],
}: {
  roomId: string;
  pageType: NotionRoomPageType;
  referenceIds?: string[];
}) {
  assertValidPageId(roomId);
  referenceIds.forEach(assertValidPageId);

  const notion = getRoomNotionClient();
  const pages = await listRoomPages(roomId);
  const highest = pages.reduce(
    (max, page) => Math.max(max, page.number ?? 0),
    0,
  );
  const nextNumber = String(highest + 1).padStart(2, "0");
  const title = `${nextNumber} ${pageType}`;

  const children =
    referenceIds.length > 0
      ? [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: `References: ${referenceIds.join(", ")}`,
                  },
                },
              ],
            },
          },
        ]
      : [];

  const createArgs = {
    parent: { page_id: roomId },
    properties: {
      title: [
        {
          type: "text",
          text: { content: title },
        },
      ],
    },
    children,
  } as unknown as Parameters<typeof notion.pages.create>[0];

  const page = await notion.pages.create(createArgs);

  return {
    id: page.id,
    title,
    createdTime:
      "created_time" in page ? page.created_time : new Date().toISOString(),
    number: highest + 1,
    type: pageType,
  } satisfies NotionRoomPage;
}
