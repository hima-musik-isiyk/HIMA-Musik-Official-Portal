import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NotionPage = PageObjectResponse;
export type NotionBlock = BlockObjectResponse & { children?: NotionBlock[] };

export interface DocMeta {
  id: string;
  slug: string;
  title: string;
  category: string;
  icon: string | null;
  order: number;
  lastEdited: string;
  published: boolean;
}

export interface ArchiveEntry {
  id: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  published: boolean;
}

export type RichTextItem = { plain_text: string };

/* ------------------------------------------------------------------ */
/*  Custom linking – anchor extraction & resolution                    */
/* ------------------------------------------------------------------ */

export const ANCHOR_TAG_RE = /\[#([a-zA-Z0-9_-]+)(\+?)\]\s*$/;

/**
 * Strips [#anchor-id] or [#anchor-id+] tags and other internal syntax from a string.
 */
export function stripCustomTags(text: string): string {
  return text.replace(ANCHOR_TAG_RE, "").trim();
}

const BLOCK_LINK_RE = /^block:\/\/(.+)$/;
const CITE_LINK_RE = /^cite:\/\/([^#]+)#(.+)$/;

// Inline patterns for naked links and custom markdown syntax
export const INLINE_BLOCK_LINK_RE =
  /block:\/\/([a-zA-Z0-9_-]+)?#([a-zA-Z0-9_-]+)/g;
export const INLINE_CITE_LINK_RE =
  /cite:\/\/([a-zA-Z0-9_-]+)#([a-zA-Z0-9_-]+)/g;
export const MARKDOWN_CUSTOM_LINK_RE =
  /\[([^\]]+)\]\(((?:block|cite):\/\/[^)]+)\)/g;

/** Extract the `[#id]` or `[#id+]` tag from a rich-text array, if present. */
export function extractAnchorId(
  richText: RichTextItem[] | undefined,
): { id: string; isAppend: boolean } | null {
  if (!richText || richText.length === 0) return null;

  // Most anchors will be at the end of the last item in a paragraph/heading
  const lastItem = richText[richText.length - 1];
  if (!lastItem?.plain_text) return null;

  const match = lastItem.plain_text.match(ANCHOR_TAG_RE);
  if (match) {
    return {
      id: match[1],
      isAppend: match[2] === "+",
    };
  }

  return null;
}

/**
 * Traverse blocks to create a map of custom IDs to block arrays.
 * Supports grouping blocks using the `[#id+]` syntax.
 */
export function buildAnchorMap(
  blocks: NotionBlock[],
): Map<string, NotionBlock[]> {
  const map = new Map<string, NotionBlock[]>();
  let lastId: string | null = null;

  for (const block of blocks) {
    const b = block as Record<string, unknown>;
    const typed = b[block.type] as { rich_text?: RichTextItem[] } | undefined;

    const anchor = extractAnchorId(typed?.rich_text);

    if (anchor) {
      if (anchor.isAppend && lastId) {
        // Continue appending to the last group if it matches or if just using +
        // Usually, the ID should match, but we can be flexible if they just do [#id+]
        const group = map.get(lastId) || [];
        group.push(block);
        map.set(lastId, group);
      } else {
        // New group or found a new base ID
        const group = map.get(anchor.id) || [];
        group.push(block);
        map.set(anchor.id, group);
        lastId = anchor.id;
      }
    } else {
      // Not an anchor block
      lastId = null;
    }

    // Recursively check children (columns, etc)
    const typedBlock = b[block.type] as
      | { children?: NotionBlock[] }
      | undefined;
    const children = typedBlock?.children;
    if (children) {
      const childMap = buildAnchorMap(children);
      for (const [id, childBlocks] of childMap.entries()) {
        const existing = map.get(id) || [];
        map.set(id, [...existing, ...childBlocks]);
      }
    }
  }

  return map;
}

/** Parse a `block://` href. */
export function parseBlockLink(
  href: string,
): { slug: string | null; anchorId: string } | null {
  const m = href.match(BLOCK_LINK_RE);
  if (!m) return null;
  const payload = m[1];
  if (payload.includes("#")) {
    const [slug, anchor] = payload.split("#", 2);
    return { slug, anchorId: anchor };
  }
  return { slug: null, anchorId: payload };
}

/** Parse a `cite://` href. */
export function parseCiteLink(
  href: string,
): { slug: string; anchorId: string } | null {
  const m = href.match(CITE_LINK_RE);
  if (!m) return null;
  return { slug: m[1], anchorId: m[2] };
}
