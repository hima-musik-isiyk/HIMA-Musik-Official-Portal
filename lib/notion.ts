import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  QueryDataSourceResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import {
  ArchiveEntry,
  buildAnchorMap,
  DocMeta,
  NotionBlock,
  NotionPage,
  stripCustomTags,
} from "./notion-shared";

export * from "./notion-shared";

/* ------------------------------------------------------------------ */
/*  Singleton client                                                   */
/* ------------------------------------------------------------------ */

const globalForNotion = globalThis as unknown as {
  notion: Client | undefined;
};

function createNotionClient() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error("Missing NOTION_TOKEN environment variable");
  }
  return new Client({ auth: token });
}

export const notion = globalForNotion.notion ?? createNotionClient();

if (process.env.NODE_ENV !== "production") {
  globalForNotion.notion = notion;
}

/* ------------------------------------------------------------------ */
/*  Custom linking – anchor extraction & resolution                    */
/* ------------------------------------------------------------------ */

/**
 * Resolve a `cite://doc-slug#anchor-id` reference.
 * Returns the target block so the renderer can inline its content.
 */
export async function resolveCitation(
  slug: string,
  anchorId: string,
): Promise<{
  blocks: NotionBlock[];
  sourceSlug: string;
  sourceTitle: string;
} | null> {
  const doc = await fetchDocBySlug(slug);
  if (!doc) return null;

  const anchorMap = buildAnchorMap(doc.blocks);
  const blocks = anchorMap.get(anchorId);
  if (!blocks || blocks.length === 0) return null;

  return { blocks, sourceSlug: doc.meta.slug, sourceTitle: doc.meta.title };
}

/* ------------------------------------------------------------------ */
/*  Notion property helpers                                            */
/* ------------------------------------------------------------------ */
function getTitle(page: NotionPage): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return stripCustomTags(prop.title.map((t) => t.plain_text).join(""));
    }
  }
  return "Untitled";
}

function getRichText(page: NotionPage, name: string): string {
  const prop = page.properties[name];
  if (prop?.type === "rich_text") {
    return stripCustomTags(prop.rich_text.map((t) => t.plain_text).join(""));
  }
  return "";
}

function getSelect(page: NotionPage, name: string): string {
  const prop = page.properties[name];
  if (prop?.type === "select" && prop.select) {
    return prop.select.name;
  }
  return "";
}

function getMultiSelect(page: NotionPage, name: string): string[] {
  const prop = page.properties[name];
  if (prop?.type === "multi_select") {
    return prop.multi_select.map((s) => s.name);
  }
  return [];
}

function getNumber(page: NotionPage, name: string): number {
  const prop = page.properties[name];
  if (prop?.type === "number" && prop.number !== null) {
    return prop.number;
  }
  return 999;
}

function getCheckbox(
  page: NotionPage,
  name: string,
  defaultValue = false,
): boolean {
  const prop = page.properties[name];
  if (prop?.type === "checkbox") {
    return prop.checkbox;
  }
  return defaultValue;
}

function getDate(page: NotionPage, name: string): string {
  const prop = page.properties[name];
  if (prop?.type === "date" && prop.date) {
    return prop.date.start;
  }
  return "";
}

/* ------------------------------------------------------------------ */
/*  Docs database queries                                              */
/* ------------------------------------------------------------------ */

const DOCS_DB_ID = process.env.NOTION_DATABASE_ID ?? "";

const dataSourceIdCache = new Map<string, string>();

function normalizeNotionId(id: string): string {
  const compact = id.replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(compact)) return id;
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

async function resolveDataSourceId(id: string): Promise<string> {
  const normalizedId = normalizeNotionId(id);
  const cached = dataSourceIdCache.get(normalizedId);
  if (cached) return cached;

  try {
    const database = await notion.databases.retrieve({
      database_id: normalizedId,
    });

    const dataSourceId = (database as { data_sources?: Array<{ id: string }> })
      .data_sources?.[0]?.id;

    if (!dataSourceId) {
      throw new Error(
        `Database ${normalizedId} has no queryable data source. Check integration access in Notion.`,
      );
    }

    dataSourceIdCache.set(normalizedId, dataSourceId);
    return dataSourceId;
  } catch {
    const dataSource = await notion.dataSources.retrieve({
      data_source_id: normalizedId,
    });
    dataSourceIdCache.set(normalizedId, dataSource.id);
    return dataSource.id;
  }
}

export const fetchAllDocs = unstable_cache(
  async (): Promise<DocMeta[]> => {
    if (!DOCS_DB_ID) return [];

    const docsDataSourceId = await resolveDataSourceId(DOCS_DB_ID);
    const results: NotionPage[] = [];
    let cursor: string | undefined;

    do {
      const response: QueryDataSourceResponse = await notion.dataSources.query({
        data_source_id: docsDataSourceId,
        start_cursor: cursor,
      });
      results.push(...(response.results as NotionPage[]));
      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);

    return results
      .map((page) => ({
        id: page.id,
        slug: getRichText(page, "Slug") || page.id,
        title: getTitle(page),
        category: getSelect(page, "Category"),
        icon: page.icon?.type === "emoji" ? page.icon.emoji : null,
        order: getNumber(page, "Order"),
        lastEdited: page.last_edited_time,
        published: getCheckbox(page, "Publish", true),
      }))
      .filter((doc) => doc.published)
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        const categoryCompare = a.category.localeCompare(b.category, "id", {
          sensitivity: "base",
        });
        if (categoryCompare !== 0) return categoryCompare;
        return a.title.localeCompare(b.title, "id", { sensitivity: "base" });
      });
  },
  ["notion-all-docs"],
  { revalidate: 60, tags: ["notion-docs"] },
);

export const fetchDocBySlug = cache(
  async (
    slug: string,
  ): Promise<{ meta: DocMeta; blocks: NotionBlock[] } | null> => {
    if (!DOCS_DB_ID) return null;

    const docsDataSourceId = await resolveDataSourceId(DOCS_DB_ID);
    const normalizedSlug = slug.trim().toLowerCase();

    let matchedPage: NotionPage | undefined;
    let cursor: string | undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: docsDataSourceId,
        start_cursor: cursor,
      });

      const page = (response.results as NotionPage[]).find((entry) => {
        const entrySlug = (getRichText(entry, "Slug") || entry.id)
          .trim()
          .toLowerCase();
        const published = getCheckbox(entry, "Publish", true);
        return entrySlug === normalizedSlug && published;
      });

      if (page) {
        matchedPage = page;
        break;
      }

      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);

    const page = matchedPage;
    if (!page) return null;

    const blocks = await fetchAllBlocks(page.id);

    return {
      meta: {
        id: page.id,
        slug: getRichText(page, "Slug") || page.id,
        title: getTitle(page),
        category: getSelect(page, "Category"),
        icon: page.icon?.type === "emoji" ? page.icon.emoji : null,
        order: getNumber(page, "Order"),
        lastEdited: page.last_edited_time,
        published: getCheckbox(page, "Publish", true),
      },
      blocks,
    };
  },
);

/* ------------------------------------------------------------------ */
/*  Archives database queries                                          */
/* ------------------------------------------------------------------ */

export const fetchArchives = unstable_cache(
  async (tag?: string): Promise<ArchiveEntry[]> => {
    if (!DOCS_DB_ID) return [];

    const docsDataSourceId = await resolveDataSourceId(DOCS_DB_ID);
    const normalizedTag = tag?.trim().toLowerCase();

    const results: NotionPage[] = [];
    let cursor: string | undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: docsDataSourceId,
        start_cursor: cursor,
      });
      results.push(...(response.results as NotionPage[]));
      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);

    return results
      .map((page) => ({
        id: page.id,
        title: getTitle(page),
        summary:
          getRichText(page, "Summary") || getRichText(page, "Slug") || "", // Fallback or summary
        date: getDate(page, "Date") || page.created_time.split("T")[0],
        tags: getMultiSelect(page, "Tags"),
        category: getSelect(page, "Category"),
        published: getCheckbox(page, "Publish", true),
      }))
      .filter((entry) => {
        if (!entry.published) return false;
        if (entry.category !== "Arsip") return false; // Only archives
        if (!normalizedTag) return true;
        return entry.tags.some((entryTag) =>
          entryTag.toLowerCase().includes(normalizedTag),
        );
      })
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      });
  },
  ["notion-archives"],
  { revalidate: 60, tags: ["notion-archives"] },
);

export async function fetchArchiveById(
  id: string,
): Promise<{ entry: ArchiveEntry; blocks: NotionBlock[] } | null> {
  if (!DOCS_DB_ID) return null;

  try {
    const page = (await notion.pages.retrieve({
      page_id: id,
    })) as NotionPage;

    const published = getCheckbox(page, "Publish", true);
    const category = getSelect(page, "Category");

    if (!published || category !== "Arsip") return null;

    const blocks = await fetchAllBlocks(page.id);

    return {
      entry: {
        id: page.id,
        title: getTitle(page),
        summary:
          getRichText(page, "Summary") || getRichText(page, "Slug") || "",
        date: getDate(page, "Date") || page.created_time.split("T")[0],
        tags: getMultiSelect(page, "Tags"),
        published: true,
      },
      blocks,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Block fetching (recursive for children)                            */
/* ------------------------------------------------------------------ */

export const fetchAllBlocks = cache(
  async (blockId: string): Promise<NotionBlock[]> => {
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined;

    do {
      const response = await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      });

      for (const rawBlock of response.results as BlockObjectResponse[]) {
        const block: NotionBlock = { ...rawBlock };
        if (block.has_children) {
          block.children = await fetchAllBlocks(block.id);
        }
        blocks.push(block);
      }

      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);

    return blocks;
  },
);

/* ------------------------------------------------------------------ */
/*  Search across all docs                                             */
/* ------------------------------------------------------------------ */

export async function searchDocs(query: string): Promise<
  Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    highlight: string;
  }>
> {
  if (!query.trim()) return [];

  const response = await notion.search({
    query,
    filter: { value: "page", property: "object" },
    page_size: 10,
  });

  const results: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    highlight: string;
  }> = [];

  for (const page of response.results as NotionPage[]) {
    const title = getTitle(page);
    const slug = getRichText(page, "Slug") || page.id;
    const category = getSelect(page, "Category");

    results.push({
      id: page.id,
      title,
      slug,
      category,
      highlight: title,
    });
  }

  return results;
}
