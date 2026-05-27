import { Client } from "@notionhq/client";

import type {
  NotionRoomPage,
  NotionRoomPageType,
} from "@/lib/notion-room/types";

const notionVersion = "2025-09-03";
const roomIdPattern =
  /^[0-9a-fA-F]{32}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type NotionRichText = Array<{
  plain_text: string;
  annotations?: {
    code?: boolean;
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    color?: string;
  };
  href?: string | null;
}>;

type NotionBlockValue = {
  rich_text?: NotionRichText;
  checked?: boolean;
  icon?: { emoji?: string };
  language?: string;
  expression?: string;
  url?: string;
  title?: string;
  has_column_header?: boolean;
};

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

function richTextToMarkdown(
  richText?: Array<{
    plain_text: string;
    annotations?: {
      code?: boolean;
      bold?: boolean;
      italic?: boolean;
      strikethrough?: boolean;
      underline?: boolean;
      color?: string;
    };
    href?: string | null;
  }>,
) {
  if (!richText) return "";
  return richText
    .map((part) => {
      let text = part.plain_text;
      if (part.annotations) {
        if (part.annotations.code) text = `\`${text}\``;
        if (part.annotations.bold) text = `**${text}**`;
        if (part.annotations.italic) text = `*${text}*`;
        if (part.annotations.strikethrough) text = `~~${text}~~`;
        if (part.annotations.underline) text = `<u>${text}</u>`;
        if (part.annotations.color && part.annotations.color !== "default") {
          text = `<span style="color: ${part.annotations.color}">${text}</span>`;
        }
      }
      if (part.href) {
        text = `[${text}](${part.href})`;
      }
      return text;
    })
    .join("");
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

      const line = await blockToMarkdown(notion, block, depth);
      if (line) lines.push(line);

      // recursion is handled within blockToMarkdown for specific types like tables/columns
      if (
        "has_children" in block &&
        block.has_children &&
        !["table", "column_list", "column"].includes(block.type)
      ) {
        lines.push(...(await listBlocksRecursive(notion, block.id, depth + 1)));
      }
    }

    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  return lines;
}

async function blockToMarkdown(
  notion: Client,
  block: { type: string; id: string; [key: string]: unknown },
  depth: number,
): Promise<string> {
  const indent = "  ".repeat(depth);
  const type = block.type;
  const value = block[type] as NotionBlockValue | undefined;
  const text = richTextToMarkdown(value?.rich_text);

  switch (type) {
    case "paragraph":
      return text ? `${indent}${text}` : "";
    case "heading_1":
      return `${indent}# ${text}`;
    case "heading_2":
      return `${indent}## ${text}`;
    case "heading_3":
      return `${indent}### ${text}`;
    case "heading_4":
      return `${indent}#### ${text}`;
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
      const emoji = value?.icon?.emoji ? `${value.icon.emoji} ` : "";
      return `${indent}> ${emoji}${text}`;
    case "code":
      return `${indent}\`\`\`${value?.language ?? ""}\n${indent}${richTextToMarkdown(value?.rich_text)}\n${indent}\`\`\``;
    case "equation":
      return `${indent}$$ ${value?.expression ?? ""} $$`;
    case "divider":
      return `${indent}---`;
    case "breadcrumb":
      return ""; // Skip breadcrumbs in MD
    case "table_of_contents":
      return `${indent}[[TOC]]`;
    case "bookmark":
    case "embed":
    case "link_preview":
    case "video":
    case "audio":
      return `${indent}[${type}: ${value?.url ?? block.id}]`;
    case "image":
    case "file":
    case "pdf":
      const label =
        getBlockAssetLabel(value as unknown as Record<string, unknown>) ??
        block.id;
      return `${indent}![${type}](${label})`;
    case "child_page":
      return `${indent}# ${value?.title ?? "Untitled"}`;
    case "child_database":
      return `${indent}### [Database: ${value?.title ?? "Untitled"}]`;
    case "table":
      const tableRows = await notion.blocks.children.list({
        block_id: block.id,
      });
      const mdRows = tableRows.results.map((r) => {
        const row = r as { table_row: { cells: NotionRichText[] } };
        const cells = row.table_row.cells.map((cell) =>
          richTextToMarkdown(cell),
        );
        return `| ${cells.join(" | ")} |`;
      });
      if (mdRows.length > 0) {
        const firstRow = tableRows.results[0] as {
          table_row: { cells: NotionRichText[] };
        };
        const firstRowCells = firstRow.table_row.cells;
        const headerDivider = `| ${firstRowCells.map(() => "---").join(" | ")} |`;
        if (value?.has_column_header) {
          mdRows.splice(1, 0, headerDivider);
        } else {
          mdRows.unshift(headerDivider);
          mdRows.unshift(
            `| ${firstRowCells.map((_, i) => `Col ${i + 1}`).join(" | ")} |`,
          );
        }
      }
      return mdRows.map((r) => `${indent}${r}`).join("\n");
    case "column_list":
      return ""; // Containers
    case "column":
      return ""; // Containers
    case "synced_block":
      return ""; // Will recurse into children
    case "template":
      return "";
    case "unsupported":
      return `${indent}[Unsupported Block: ${block.id}]`;
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

export function extractPageTitle(properties: Record<string, unknown>) {
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

  // Cleanup any block that is not a child_page to avoid empty block gaps
  let hasMore = true;
  let startCursor: string | undefined = undefined;
  while (hasMore) {
    const listResponse = await notion.blocks.children.list({
      block_id: roomId,
      start_cursor: startCursor,
      page_size: 100,
    });
    for (const block of listResponse.results) {
      if ("type" in block && block.type !== "child_page") {
        try {
          await notion.blocks.delete({ block_id: block.id });
        } catch (err) {
          console.error(`Failed to delete non-page block ${block.id}:`, err);
        }
      }
    }
    hasMore = listResponse.has_more;
    startCursor = listResponse.next_cursor ?? undefined;
  }

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
