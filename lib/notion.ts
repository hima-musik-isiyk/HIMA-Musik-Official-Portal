import { Client } from "@notionhq/client";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { cache } from "react";

// Custom cache wrapper with environment-aware revalidation strategy:
// - Development: 1 second → instant page reloads when editing Notion locally.
// - Production:  false (never expire by timer) → pages are served from cache
//   indefinitely and rely 100% on Notion webhook on-demand revalidation for
//   instant updates. This is the fastest possible architecture.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unstable_cache<T extends (...args: any[]) => Promise<any>>(
  cb: T,
  _keyParts?: string[],
  _options?: { revalidate?: number | false; tags?: string[] },
): T {
  // Bypass all caching to fetch the absolute latest data from Notion directly and instantaneously
  return cb;
}

import { classifyEventLifecycle, getEventDateSortValue } from "./event-dates";
import type { KKMGroup } from "./kkm-data";
import {
  ArchiveEntry,
  buildAnchorMap,
  DocMeta,
  extractRichTextPlainText,
  NotionBlock,
  NotionPage,
  stripCustomTags,
} from "./notion-shared";

export * from "./notion-shared";

export type NotionContentScope =
  | "sekretariat"
  | "kkm"
  | "events"
  | "beranda"
  | "profil"
  | "karya";

export type EventLifecycle =
  | "upcoming"
  | "ongoing"
  | "past"
  | "timeless"
  | "announcement";

export interface EventEntryMeta extends DocMeta {
  summary: string;
  ownerUnit: string;
  entryKind: string;
  eventDate: string;
  eventDateEnd: string;
  location: string;
  registrationLink: string;
  sourceLink: string;
  sourceName: string;
  isRepost: boolean;
  coverImageUrl: string | null;
  lifecycle: EventLifecycle;
}

export interface EventsCollection {
  upcoming: EventEntryMeta[];
  ongoing: EventEntryMeta[];
  past: EventEntryMeta[];
  announcements: EventEntryMeta[];
}

export interface BerandaEntry {
  id: string;
  title: string;
  slug: string;
  blockType: "Hero" | "Banner Pengumuman" | "CTA Rekrutmen" | "Highlight Acara";
  status: string;
  lastModified: string;
  blocks: NotionBlock[];
}

export interface ProfilEntry {
  id: string;
  title: string;
  slug: string;
  order: number;
  status: string;
  lastModified: string;
  blocks: NotionBlock[];
}

export interface KaryaEntryMeta {
  id: string;
  slug: string;
  title: string;
  creator: string;
  genres: string[];
  platform: string;
  platforms: string[];
  embedLink: string;
  embedUrl: string;
  artworkUrl: string | null;
  nim: number;
  email: string;
  submissionDate: string;
  lastEdited: string;
}

/* ------------------------------------------------------------------ */
/*  Singleton client                                                   */
/* ------------------------------------------------------------------ */

const globalForNotion = globalThis as unknown as {
  notion: Client | undefined;
};

function createNotionClient() {
  const token = process.env.NOTION_INTEGRATION_TOKEN;
  if (!token) {
    console.warn("Missing NOTION_INTEGRATION_TOKEN environment variable");
    return null;
  }
  return new Client({ auth: token, notionVersion: "2025-09-03" });
}

export function getNotionClient(): Client {
  if (globalForNotion.notion) {
    return globalForNotion.notion;
  }

  const client = createNotionClient();

  if (client && process.env.NODE_ENV !== "production") {
    globalForNotion.notion = client;
  }

  return client as Client;
}

function getNotionClientAny(): any {
  return getNotionClient() as any;
}

/* ------------------------------------------------------------------ */
/*  Custom linking – anchor extraction & resolution                    */
/* ------------------------------------------------------------------ */

/**
 * Resolve a `cite://doc-slug#anchor-id` reference.
 * Returns the target block so the renderer can inline its content.
 */
export async function resolveCitation(
  scope: NotionContentScope,
  slug: string,
  anchorId: string,
): Promise<{
  blocks: NotionBlock[];
  sourceSlug: string;
  sourceTitle: string;
} | null> {
  const doc =
    scope === "kkm"
      ? await fetchKKMEntryBySlug(slug)
      : scope === "events"
        ? await fetchEventBySlug(slug)
        : await fetchDocBySlug(slug);
  if (!doc) return null;

  const anchorMap = buildAnchorMap(doc.blocks);
  const blocks = anchorMap.get(anchorId);
  if (!blocks || blocks.length === 0) return null;

  return { blocks, sourceSlug: doc.meta.slug, sourceTitle: doc.meta.title };
}

/* ------------------------------------------------------------------ */
/*  Notion property helpers                                            */
/* ------------------------------------------------------------------ */
const propertyNameMapCache = new WeakMap<
  NotionPage["properties"],
  Map<string, keyof NotionPage["properties"]>
>();

function normalizePropertyName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function getProperty(
  page: NotionPage,
  name: string,
): NotionPage["properties"][string] | undefined {
  const properties = page.properties;
  const normalizedName = normalizePropertyName(name);

  let propertyNameMap = propertyNameMapCache.get(properties);
  if (!propertyNameMap) {
    propertyNameMap = new Map();
    for (const key of Object.keys(properties)) {
      propertyNameMap.set(normalizePropertyName(key), key);
    }
    propertyNameMapCache.set(properties, propertyNameMap);
  }

  const matchedKey = propertyNameMap.get(normalizedName);
  return matchedKey ? properties[matchedKey] : undefined;
}

function getTitle(page: NotionPage): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return stripCustomTags(prop.title.map((t) => t.plain_text).join(""));
    }
  }
  return "Untitled";
}

function getTitleProperty(page: NotionPage, name: string): string {
  const prop = getProperty(page, name);
  if (prop?.type === "title" && prop.title.length > 0) {
    return stripCustomTags(prop.title.map((t) => t.plain_text).join(""));
  }
  return "";
}

function getRichText(page: NotionPage, name: string): string {
  const prop = getProperty(page, name);
  if (prop?.type === "rich_text") {
    return stripCustomTags(prop.rich_text.map((t) => t.plain_text).join(""));
  }
  return "";
}

function getSelect(page: NotionPage, name: string): string {
  const prop = getProperty(page, name);
  if (prop?.type === "select" && prop.select) {
    return prop.select.name;
  }
  return "";
}

function getStatus(page: NotionPage, name: string): string {
  const prop = getProperty(page, name);
  if (prop?.type === "status" && prop.status) {
    return prop.status.name;
  }
  return "";
}

function getMultiSelect(page: NotionPage, name: string): string[] {
  const prop = getProperty(page, name);
  if (prop?.type === "multi_select") {
    return prop.multi_select.map((s) => s.name);
  }
  return [];
}

function getNumber(page: NotionPage, name: string): number {
  const prop = getProperty(page, name);
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
  const prop = getProperty(page, name);
  if (prop?.type === "checkbox") {
    return prop.checkbox;
  }
  return defaultValue;
}

function getDate(page: NotionPage, name: string): string {
  const prop = getProperty(page, name);
  if (prop?.type === "date" && prop.date) {
    return prop.date.start;
  }
  return "";
}

function getDateEnd(page: NotionPage, name: string): string {
  const prop = getProperty(page, name);
  if (prop?.type === "date" && prop.date?.end) {
    return prop.date.end;
  }
  return "";
}

function getUrl(page: NotionPage, name: string): string {
  const prop = getProperty(page, name);
  if (prop?.type === "url" && prop.url) {
    return prop.url.trim();
  }
  return "";
}

function getFormulaString(page: NotionPage, name: string): string {
  const prop = getProperty(page, name);
  if (prop?.type === "formula") {
    if (prop.formula.type === "string" && prop.formula.string) {
      return prop.formula.string.trim();
    }
    if (prop.formula.type === "date" && prop.formula.date?.start) {
      return prop.formula.date.start;
    }
  }
  return "";
}

function getFiles(page: NotionPage, name: string): string[] {
  const prop = getProperty(page, name);
  if (prop?.type !== "files") return [];
  return prop.files
    .map((file) => {
      if (file.type === "external") return file.external.url;
      if (file.type === "file") return file.file.url;
      return "";
    })
    .filter(Boolean);
}

function getCoverUrl(page: NotionPage, name = "Cover Image"): string | null {
  return getFiles(page, name)[0] ?? null;
}

function getChildPageTitle(block: NotionBlock): string {
  if (block.type !== "child_page") return "";
  const typed = block.child_page as { title?: string } | undefined;
  return (typed?.title ?? "").trim();
}

function isPreferredEventChildPage(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  return /shared|share|draft|publish|published|konten|content|public|umum/.test(
    normalized,
  );
}

function findPreferredChildPage(blocks: NotionBlock[]): NotionBlock | null {
  let firstChildPage: NotionBlock | null = null;

  for (const block of blocks) {
    if (block.type === "child_page") {
      if (!firstChildPage) {
        firstChildPage = block;
      }

      if (isPreferredEventChildPage(getChildPageTitle(block))) {
        return block;
      }
    }

    if (block.children?.length) {
      const nested = findPreferredChildPage(block.children);
      if (nested) {
        return nested;
      }
    }
  }

  return firstChildPage;
}

function selectEventContentBlocks(blocks: NotionBlock[]): NotionBlock[] {
  const dropUntilAfterFirstTopLevelTable = (
    items: NotionBlock[],
  ): NotionBlock[] => {
    const firstTableIndex = items.findIndex((block) => block.type === "table");
    if (firstTableIndex < 0) return items;
    return items.slice(firstTableIndex + 1);
  };

  const preferredChildPage = findPreferredChildPage(blocks);
  if (preferredChildPage?.children?.length) {
    // Shared subpages may include internal briefing blocks before the
    // admin/KKM communication table. Hide everything up to and including
    // that first top-level table from public event rendering.
    return dropUntilAfterFirstTopLevelTable(preferredChildPage.children);
  }

  return blocks;
}

function getSlugValue(page: NotionPage, fallbackText: string): string {
  return (
    getRichText(page, "Slug") ||
    getFormulaString(page, "Slug") ||
    slugify(fallbackText)
  );
}

function getTodayInJakarta(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isEventPublished(page: NotionPage): boolean {
  const status = getStatus(page, "Status");
  if (status) {
    return status === "Published";
  }
  const statusCms = getStatus(page, "Status Konten CMS");
  if (statusCms) {
    return statusCms === "Live";
  }
  return getCheckbox(page, "Publish", true);
}

function isEventPreviewable(page: NotionPage): boolean {
  const status = getStatus(page, "Status");
  if (status) {
    return status === "Diedit KKM";
  }
  return false;
}

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ------------------------------------------------------------------ */
/*  Docs database queries                                              */
/* ------------------------------------------------------------------ */

/*
const DOCS_DB_ID =
  process.env.NOTION_SEKRETARIAT_DATABASE_ID ??
  process.env.NOTION_PROJECT_DATABASE_ID ??
  "";
*/

const dataSourceIdCache = new Map<string, string>();
const warnedDatabaseIds = new Set<string>();

function normalizeNotionId(id: string): string {
  const compact = id.replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(compact)) return id;
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

export async function resolveDataSourceId(id: string): Promise<string> {
  const normalizedId = normalizeNotionId(id);
  const cached = dataSourceIdCache.get(normalizedId);
  if (cached) return cached;

  try {
    const database = await getNotionClient().databases.retrieve({
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
    const dataSource = await (
      getNotionClient() as ReturnType<typeof getNotionClient>
    ).dataSources.retrieve({
      data_source_id: normalizedId,
    });
    dataSourceIdCache.set(normalizedId, dataSource.id);
    return dataSource.id;
  }
}

export async function resolveDataSourceIdSafe(
  id: string,
): Promise<string | null> {
  try {
    return await resolveDataSourceId(id);
  } catch (error) {
    const normalizedId = normalizeNotionId(id);
    if (!warnedDatabaseIds.has(normalizedId)) {
      warnedDatabaseIds.add(normalizedId);
      console.error(
        `Notion database ${normalizedId} is unavailable. Check integration access/sharing.`,
        error,
      );
    }
    return null;
  }
}

interface PageDatabases {
  childDatabases: string[];
  mentionedDatabases: string[];
}

export interface ChildDatabaseRef {
  id: string;
  title: string;
}

async function resolveChildDatabaseTitle(
  blockId: string,
  blockTitle: unknown,
): Promise<string> {
  const fromBlock = extractRichTextPlainText(blockTitle);
  if (fromBlock) return fromBlock;

  try {
    const client = getNotionClient();
    if (!client) return "";
    const database = await client.databases.retrieve({
      database_id: normalizeNotionId(blockId),
    });
    if ("title" in database) {
      return extractRichTextPlainText(database.title);
    }
  } catch {
    // Fall through — caller may match by block order.
  }
  return "";
}

export async function fetchPageChildDatabases(
  pageId: string,
): Promise<ChildDatabaseRef[]> {
  const refs: ChildDatabaseRef[] = [];
  if (!pageId) return refs;

  const client = getNotionClient();
  if (!client) return refs;

  try {
    let cursor: string | undefined;

    do {
      const response = await client.blocks.children.list({
        block_id: normalizeNotionId(pageId),
        start_cursor: cursor,
      });

      for (const block of response.results as any[]) {
        if (block.type !== "child_database") continue;
        const title = await resolveChildDatabaseTitle(
          block.id,
          block.child_database?.title,
        );
        refs.push({ id: block.id, title });
      }

      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);
  } catch (error) {
    console.error(
      `[Notion fetchPageChildDatabases] Failed for page ${pageId}:`,
      error,
    );
  }

  return refs;
}

export async function fetchPageDatabases(
  pageId: string,
): Promise<PageDatabases> {
  const result: PageDatabases = {
    childDatabases: [],
    mentionedDatabases: [],
  };

  if (!pageId) return result;

  try {
    const response = await getNotionClient().blocks.children.list({
      block_id: normalizeNotionId(pageId),
    });

    for (const block of response.results as any[]) {
      if (block.type === "child_database") {
        result.childDatabases.push(block.id);
      } else {
        const blockContent = (block as any)[block.type];
        if (blockContent && Array.isArray(blockContent.rich_text)) {
          for (const rt of blockContent.rich_text) {
            if (rt.type === "mention" && rt.mention?.type === "database") {
              result.mentionedDatabases.push(rt.mention.database.id);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `[Notion fetchPageDatabases] Failed for page ${pageId}:`,
      error,
    );
  }

  return result;
}

const KKM_PAGE_ID = process.env.NOTION_KKM_PAGE_ID ?? "";
const KARYA_PAGE_ID = process.env.NOTION_KARYA_PAGE_ID ?? "";
const NOTION_SEKRETARIAT_PAGE_ID = process.env.NOTION_SEKRETARIAT_PAGE_ID ?? "";
const DOCS_DB_ID = "36f3b26d-c3be-8017-ba07-e3a418fa4366";

function getRelationIds(page: NotionPage, name: string): string[] {
  const prop = getProperty(page, name);
  if (prop?.type === "relation" && Array.isArray(prop.relation)) {
    return prop.relation.map((r) => r.id);
  }
  return [];
}

export async function resolveSekretariatDatabases(
  pageId: string,
): Promise<{ docsDbId: string; categoriesDbId: string }> {
  const result = {
    docsDbId: "36f3b26d-c3be-8017-ba07-e3a418fa4366",
    categoriesDbId: "36f3b26d-c3be-800a-bbfa-f34ad546ec0e",
  };

  if (!pageId) return result;

  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.childDatabases.length >= 2) {
      result.docsDbId = dbs.childDatabases[0];
      result.categoriesDbId = dbs.childDatabases[1];
    } else if (dbs.childDatabases.length === 1) {
      result.docsDbId = dbs.childDatabases[0];
    }
  } catch (error) {
    console.warn(
      "[Notion resolveSekretariatDatabases] Failed to fetch page child databases",
      error,
    );
  }

  return result;
}

export const resolveSekretariatDatabasesCached = unstable_cache(
  async (
    pageId: string,
  ): Promise<{ docsDbId: string; categoriesDbId: string }> => {
    return resolveSekretariatDatabases(pageId);
  },
  ["notion-sekretariat-databases"],
  { revalidate: 60, tags: ["notion-docs"] },
);

export interface SekretariatCategory {
  id: string;
  name: string;
  description: string;
}

export const fetchSekretariatCategories = unstable_cache(
  async (categoriesDbId: string): Promise<SekretariatCategory[]> => {
    if (!categoriesDbId) return [];
    const results: NotionPage[] = [];
    let cursor: string | undefined;

    try {
      const dataSourceId = await resolveDataSourceIdSafe(categoriesDbId);
      if (!dataSourceId) return [];

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });
        results.push(...(response.results as NotionPage[]));
        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    } catch (error) {
      console.error("[Notion fetchSekretariatCategories] Query failed:", error);
      return [];
    }

    return results.map((page) => {
      const name = getTitleProperty(page, "Name") || getTitle(page);
      const description = getRichText(page, "Deskripsi");
      return {
        id: page.id,
        name,
        description,
      };
    });
  },
  ["notion-sekretariat-categories-data"],
  { revalidate: 60, tags: ["notion-docs"] },
);

export interface SekretariatPortalData {
  docs: DocMeta[];
  categories: SekretariatCategory[];
}

export const fetchSekretariatPortalData = unstable_cache(
  async (): Promise<SekretariatPortalData> => {
    const pageId = NOTION_SEKRETARIAT_PAGE_ID;
    let docsDbId = DOCS_DB_ID;
    let categoriesDbId = "";

    if (pageId) {
      const resolved = await resolveSekretariatDatabasesCached(pageId);
      docsDbId = resolved.docsDbId;
      categoriesDbId = resolved.categoriesDbId;
    }

    if (!docsDbId) {
      return { docs: [], categories: [] };
    }

    const categories = categoriesDbId
      ? await fetchSekretariatCategories(categoriesDbId)
      : [];

    const categoryMap = new Map<string, SekretariatCategory>(
      categories.map((c) => [normalizeNotionId(c.id), c]),
    );

    const results: NotionPage[] = [];
    let cursor: string | undefined;

    try {
      const dataSourceId = await resolveDataSourceIdSafe(docsDbId);
      if (!dataSourceId) return { docs: [], categories };

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });
        results.push(...(response.results as NotionPage[]));
        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    } catch (error) {
      console.error("[Notion fetchAllDocs] Query failed:", error);
      return { docs: [], categories };
    }

    const docs = results
      .map((page) => {
        const title =
          getTitleProperty(page, "Nama Dokumen") ||
          getTitleProperty(page, "Name") ||
          getTitle(page);

        const relationIds = getRelationIds(page, "Kategori");
        let category = "";
        if (relationIds.length > 0) {
          category =
            relationIds
              .map((id) => categoryMap.get(normalizeNotionId(id))?.name)
              .filter(Boolean)[0] || "";
        }
        if (!category) {
          category =
            getSelect(page, "Kategori") ||
            getSelect(page, "Category") ||
            "Umum";
        }

        const status =
          getStatus(page, "Status") || getStatus(page, "Status Konten CMS");
        const isPublished = status
          ? status === "Publish" || status === "Live"
          : getCheckbox(page, "Publish", true);

        return {
          id: page.id,
          slug: getRichText(page, "Slug") || page.id,
          title,
          category,
          icon: page.icon?.type === "emoji" ? page.icon.emoji : null,
          order:
            getNumber(page, "Urutan Tampil") ?? getNumber(page, "Order") ?? 999,
          createdAt: page.created_time,
          lastEdited: page.last_edited_time,
          published: isPublished,
        };
      })
      .filter((doc) => doc.published)
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        const categoryCompare = (a.category || "").localeCompare(
          b.category || "",
          "id",
          {
            sensitivity: "base",
          },
        );
        if (categoryCompare !== 0) return categoryCompare;
        return a.title.localeCompare(b.title, "id", { sensitivity: "base" });
      });

    return { docs, categories };
  },
  ["notion-sekretariat-portal-data"],
  { revalidate: 60, tags: ["notion-docs"] },
);

export const fetchAllDocs = unstable_cache(
  async (): Promise<DocMeta[]> => {
    const data = await fetchSekretariatPortalData();
    return data.docs;
  },
  ["notion-all-docs"],
  { revalidate: 60, tags: ["notion-docs"] },
);

/* ------------------------------------------------------------------ */
/*  KKM database queries                                               */
/* ------------------------------------------------------------------ */

export async function resolveKKMDatabases(
  pageId: string,
): Promise<{ heroDbId: string; groupsDbId: string }> {
  const result = {
    heroDbId: "36e3b26d-c3be-80de-a00e-dff07d738239",
    groupsDbId: "36e3b26d-c3be-8065-94be-f94365699c8d",
  };

  if (!pageId) return result;

  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.childDatabases.length >= 2) {
      result.heroDbId = dbs.childDatabases[0];
      result.groupsDbId = dbs.childDatabases[1];
    } else if (dbs.childDatabases.length === 1) {
      const singleId = dbs.childDatabases[0];
      if (singleId === "36e3b26d-c3be-80de-a00e-dff07d738239") {
        result.heroDbId = singleId;
      } else {
        result.groupsDbId = singleId;
      }
    }
  } catch (error) {
    console.warn(
      "[Notion resolveKKMDatabases] Failed to fetch page child databases",
      error,
    );
  }

  return result;
}

export async function fetchKKMDatabaseId(pageId: string): Promise<string> {
  if (!pageId) return "36e3b26d-c3be-8065-94be-f94365699c8d";
  const resolved = await resolveKKMDatabases(pageId);
  return resolved.groupsDbId;
}

export const fetchKKMDatabaseIdCached = unstable_cache(
  async (pageId: string): Promise<string> => {
    return fetchKKMDatabaseId(pageId);
  },
  ["notion-kkm-database-id"],
  { revalidate: 60, tags: ["notion-kkm"] },
);

export async function resolveFAQDatabase(pageId: string): Promise<string> {
  const defaultDbId = "36d3b26d-c3be-8041-b2bd-d9b7f746e06e";
  if (!pageId) return defaultDbId;
  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.childDatabases.length >= 1) {
      return dbs.childDatabases[0];
    }
  } catch (error) {
    console.warn(
      "[Notion resolveFAQDatabase] Failed to fetch page child databases",
      error,
    );
  }
  return defaultDbId;
}

export const resolveFAQDatabaseCached = unstable_cache(
  async (pageId: string): Promise<string> => {
    return resolveFAQDatabase(pageId);
  },
  ["notion-faq-database-id"],
  { revalidate: 60, tags: ["notion-faq"] },
);

export const fetchKKMGroups = unstable_cache(
  async (): Promise<KKMGroup[]> => {
    const activeDbId = KKM_PAGE_ID
      ? await fetchKKMDatabaseIdCached(KKM_PAGE_ID)
      : "36e3b26d-c3be-8065-94be-f94365699c8d";

    if (!activeDbId) return [];

    const results: NotionPage[] = [];
    let cursor: string | undefined;

    try {
      const dataSourceId = await resolveDataSourceIdSafe(activeDbId);
      if (!dataSourceId) return [];

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });
        results.push(...(response.results as NotionPage[]));
        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    } catch (error) {
      console.error("[Notion fetchKKMGroups] Query failed:", error);
      return [];
    }

    const groups: KKMGroup[] = [];

    for (const page of results) {
      const name = (
        getTitleProperty(page, "Name") ||
        getTitleProperty(page, "Nama Unit KKM") ||
        getTitle(page)
      ).trim();
      if (!name) {
        continue;
      }

      const status = getStatus(page, "Status Konten CMS");
      if (status && status !== "Live") continue;

      const tagline = getRichText(page, "Jargon") || "";
      const description = getRichText(page, "Deskripsi Singkat") || "";

      const logoUrl = getFiles(page, "Logo")[0] || null;
      const instagram = getUrl(page, "Instagram") || "";
      const tiktok = getUrl(page, "TikTok") || "";
      const youtube = getUrl(page, "YouTube") || "";

      let socialLinks = [instagram, tiktok, youtube].filter(Boolean);
      if (socialLinks.length === 0) {
        const contacts =
          getRichText(page, "Kontak Unit") ||
          getRichText(page, "Link Sosmed") ||
          getUrl(page, "Link Sosmed");
        socialLinks = contacts
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);
      }

      const order =
        getNumber(page, "Urutan") ??
        getNumber(page, "Urutan Tampil") ??
        getNumber(page, "Order") ??
        999;

      groups.push({
        id: page.id,
        slug: getRichText(page, "Slug") || slugify(name),
        name,
        tagline,
        description,
        logoUrl,
        instagram,
        tiktok,
        youtube,
        socialLinks,
        order,
      });
    }

    groups.sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, "id", { sensitivity: "base" });
    });

    return groups;
  },
  ["notion-kkm-groups"],
  { revalidate: 60, tags: ["notion-kkm"] },
);

export interface KKMHeroData {
  title: string;
  description: string;
}

export interface KKMModularData {
  hero: KKMHeroData;
  groups: KKMGroup[];
}

export async function fetchKKMModularData(
  pageId: string,
): Promise<KKMModularData> {
  const data: KKMModularData = {
    hero: {
      title: "KKM HIMA MUSIK",
      description:
        "Delapan komunitas kreatif di bawah naungan HIMA MUSIK ISI Yogyakarta. Temukan keluarga bermusikmu, kembangkan potensi, dan ciptakan karya bersama.",
    },
    groups: [],
  };

  if (!pageId) {
    data.groups = await fetchKKMGroups();
    return data;
  }

  const resolved = await resolveKKMDatabases(pageId);

  // 1. Fetch KKM: Hero Section if found
  if (resolved.heroDbId) {
    try {
      const dataSourceId = await resolveDataSourceIdSafe(resolved.heroDbId);
      if (dataSourceId) {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
        });

        for (const page of response.results) {
          const name = (getTitleProperty(page, "Name") || getTitle(page))
            .trim()
            .toLowerCase();
          const value = getRichText(page, "Value");
          if (name.includes("title")) {
            data.hero.title = value;
          } else if (name.includes("desc")) {
            data.hero.description = value;
          }
        }
      }
    } catch (error) {
      console.warn(
        "[Notion fetchKKMModularData] Failed to fetch KKM Hero Section, using default",
        error,
      );
    }
  }

  // 2. Fetch KKM Groups
  data.groups = await fetchKKMGroups();

  return data;
}

export const fetchKKMModularDataCached = unstable_cache(
  async (pageId: string): Promise<KKMModularData> => {
    return fetchKKMModularData(pageId);
  },
  ["notion-kkm-modular-data"],
  { revalidate: 60, tags: ["notion-kkm"] },
);

export const fetchKKMEntryBySlug = cache(
  async (
    slug: string,
  ): Promise<{ meta: DocMeta; blocks: NotionBlock[] } | null> => {
    const activeDbId = KKM_PAGE_ID
      ? await fetchKKMDatabaseIdCached(KKM_PAGE_ID)
      : "36e3b26d-c3be-8065-94be-f94365699c8d";

    if (!activeDbId) return null;

    const normalizedSlug = slug.trim().toLowerCase();
    let matchedPage: NotionPage | undefined;
    let cursor: string | undefined;

    try {
      const dataSourceId = await resolveDataSourceIdSafe(activeDbId);
      if (!dataSourceId) return null;

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });

        const page = (response.results as NotionPage[]).find((entry) => {
          const name = (
            getTitleProperty(entry, "Name") ||
            getTitleProperty(entry, "Nama Unit KKM") ||
            getTitle(entry)
          ).trim();
          const entrySlug = (getRichText(entry, "Slug") || slugify(name))
            .trim()
            .toLowerCase();
          return entrySlug === normalizedSlug;
        });

        if (page) {
          matchedPage = page;
          break;
        }

        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    } catch (error) {
      console.error("[Notion fetchKKMEntryBySlug] Query failed:", error);
      return null;
    }

    if (!matchedPage) return null;

    const name = (
      getTitleProperty(matchedPage, "Name") ||
      getTitleProperty(matchedPage, "Nama Unit KKM") ||
      getTitle(matchedPage)
    ).trim();
    const entrySlug = (
      getRichText(matchedPage, "Slug") || slugify(name)
    ).trim();
    const blocks = await fetchAllBlocks(matchedPage.id);

    return {
      meta: {
        id: matchedPage.id,
        slug: entrySlug,
        title: name,
        category: "KKM",
        icon:
          matchedPage.icon?.type === "emoji" ? matchedPage.icon.emoji : null,
        order: 999,
        createdAt: matchedPage.created_time,
        lastEdited: matchedPage.last_edited_time,
        published: true,
      },
      blocks,
    };
  },
);

function mapEventPage(page: NotionPage, today: string): EventEntryMeta {
  const title =
    getTitleProperty(page, "Nama Acara") ||
    getTitleProperty(page, "Judul Tayangan") ||
    getTitleProperty(page, "Name") ||
    getTitle(page);
  const slug =
    getRichText(page, "Request Slug Khusus") || getSlugValue(page, title);
  const eventDate =
    getDate(page, "Tanggal Acara") ||
    getDate(page, "Event Date") ||
    getDate(page, "Date");
  const eventDateEnd =
    getDateEnd(page, "Tanggal Acara") ||
    getDateEnd(page, "Event Date") ||
    getDateEnd(page, "Date");
  const sourceLink = getUrl(page, "Source Link");
  const sourceName = getRichText(page, "Source Name");
  const isRepost = getCheckbox(page, "Repost", false);
  const entryKind =
    getSelect(page, "Tipe Acara") ||
    getSelect(page, "Entry Kind") ||
    (eventDate ? "Event" : "Announcement");
  const lifecycle = classifyEventLifecycle(
    entryKind,
    { start: eventDate, end: eventDateEnd },
    today,
  );
  const ownerUnit =
    getRichText(page, "KKM Pengusul") || getSelect(page, "Owner Unit");

  const createdAt =
    page.properties["Submission time"]?.type === "created_time"
      ? page.properties["Submission time"].created_time
      : page.created_time;

  return {
    id: page.id,
    slug,
    title,
    category: "Events",
    icon: page.icon?.type === "emoji" ? page.icon.emoji : null,
    order: 999,
    createdAt: createdAt,
    lastEdited: page.last_edited_time,
    published: isEventPublished(page),
    summary:
      getRichText(page, "Deskripsi Singkat Acara") ||
      getRichText(page, "Summary"),
    ownerUnit,
    entryKind,
    eventDate,
    eventDateEnd,
    location:
      getRichText(page, "Lokasi Acara") ||
      getRichText(page, "Lokasi") ||
      getRichText(page, "Location"),
    registrationLink: getUrl(page, "Registration Link"),
    sourceLink,
    sourceName,
    isRepost,
    coverImageUrl: getFiles(page, "Gambar")[0] || getCoverUrl(page),
    lifecycle,
  };
}

function sortEventEntries(
  entries: EventEntryMeta[],
  lifecycle: EventLifecycle,
) {
  return [...entries].sort((a, b) => {
    const sortA =
      lifecycle === "announcement" || lifecycle === "timeless"
        ? getEventDateSortValue(a.lastEdited)
        : getEventDateSortValue(
            a.eventDate,
            a.eventDateEnd,
            lifecycle === "past",
          );
    const sortB =
      lifecycle === "announcement" || lifecycle === "timeless"
        ? getEventDateSortValue(b.lastEdited)
        : getEventDateSortValue(
            b.eventDate,
            b.eventDateEnd,
            lifecycle === "past",
          );

    if (sortA !== sortB) {
      return lifecycle === "past" ? sortB - sortA : sortA - sortB;
    }

    return a.title.localeCompare(b.title, "id", { sensitivity: "base" });
  });
}

/* ------------------------------------------------------------------ */
/*  Karya database queries                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Karya database queries                                              */
/* ------------------------------------------------------------------ */

async function resolveKaryaMediaDetails(
  platformSelects: string[],
  embedLink: string,
): Promise<{ embedUrl: string; artworkUrl: string | null }> {
  const details = {
    embedUrl: embedLink,
    artworkUrl: null as string | null,
  };

  if (!embedLink) return details;

  const url = embedLink.trim();

  // Match platform from URL
  const isYouTube = /youtube\.com|youtu\.be/i.test(url);
  const isSpotify = /spotify\.com/i.test(url);
  const isSoundCloud = /soundcloud\.com/i.test(url);
  const isAppleMusic = /music\.apple\.com/i.test(url);

  if (isYouTube) {
    const ytRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(ytRegex);
    const videoId = match ? match[1] : null;
    if (videoId) {
      details.embedUrl = `https://www.youtube.com/embed/${videoId}`;
      details.artworkUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  } else if (isSpotify) {
    if (url.includes("open.spotify.com/")) {
      details.embedUrl = url.replace(
        "open.spotify.com/",
        "open.spotify.com/embed/",
      );
    }
    try {
      const res = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
      );
      if (res.ok) {
        const data = await res.json();
        details.artworkUrl = data.thumbnail_url || null;
      }
    } catch (err) {
      console.error(
        "[Notion resolveKaryaMediaDetails] Spotify oEmbed error:",
        err,
      );
    }
  } else if (isSoundCloud) {
    details.embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23d4a64d&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=true`;
    try {
      const res = await fetch(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      );
      if (res.ok) {
        const data = await res.json();
        details.artworkUrl = data.thumbnail_url || null;
      }
    } catch (err) {
      console.error(
        "[Notion resolveKaryaMediaDetails] SoundCloud oEmbed error:",
        err,
      );
    }
  } else if (isAppleMusic) {
    if (url.includes("music.apple.com/")) {
      details.embedUrl = url.replace(
        "music.apple.com/",
        "embed.music.apple.com/",
      );
    }
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (res.ok) {
        const html = await res.text();
        const match =
          html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
          html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
        if (match) {
          details.artworkUrl = match[1];
        }
      }
    } catch (err) {
      console.error(
        "[Notion resolveKaryaMediaDetails] Apple Music error:",
        err,
      );
    }
  }

  return details;
}

export async function fetchKaryaDatabaseId(pageId: string): Promise<string> {
  if (!pageId) return "";
  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.childDatabases.length >= 1) {
      return dbs.childDatabases[0];
    }
  } catch (error) {
    console.warn(
      "[Notion fetchKaryaDatabaseId] Failed to fetch page child databases",
      error,
    );
  }
  return "";
}

export const fetchKaryaDatabaseIdCached = unstable_cache(
  async (pageId: string): Promise<string> => {
    return fetchKaryaDatabaseId(pageId);
  },
  ["notion-karya-database-id"],
  { revalidate: 60, tags: ["notion-karya"] },
);

export async function fetchAduanDatabaseId(pageId: string): Promise<string> {
  if (!pageId) return "";
  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.mentionedDatabases.length > 0) {
      return dbs.mentionedDatabases[0];
    }
    if (dbs.childDatabases.length > 0) {
      return dbs.childDatabases[0];
    }
  } catch (error) {
    console.warn(
      "[Notion fetchAduanDatabaseId] Failed to fetch page child databases",
      error,
    );
  }
  return "";
}

export const fetchAduanDatabaseIdCached = unstable_cache(
  async (pageId: string): Promise<string> => {
    return fetchAduanDatabaseId(pageId);
  },
  ["notion-aduan-database-id"],
  { revalidate: 60, tags: ["notion-aduan"] },
);

export const fetchKaryaEntries = unstable_cache(
  async (): Promise<KaryaEntryMeta[]> => {
    if (!KARYA_PAGE_ID) return [];

    const results: NotionPage[] = [];
    let cursor: string | undefined;

    try {
      const activeDbId = await fetchKaryaDatabaseIdCached(KARYA_PAGE_ID);
      if (!activeDbId) return [];

      const dataSourceId = await resolveDataSourceIdSafe(activeDbId);
      if (!dataSourceId) return [];

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });
        results.push(...(response.results as NotionPage[]));
        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    } catch (error) {
      console.error("[Notion fetchKaryaEntries] Query failed:", error);
      return [];
    }

    const filteredPages = results.filter((page) => {
      const status = getStatus(page, "Status");
      return status === "Published";
    });

    const parsedEntries = await Promise.all(
      filteredPages.map(async (page) => {
        const title =
          getTitleProperty(page, "Band/Artist dan Judul Karya / Tayangan") ||
          getTitleProperty(page, "Judul Karya / Tayangan") ||
          getTitle(page);
        const slug = getSlugValue(page, title);
        const creator = getRichText(page, "Pencipta / Penampil");
        const genres = getMultiSelect(page, "Genre / Jenis Karya");
        const platforms = getMultiSelect(page, "Platform Utama");
        const embedLink = getUrl(page, "Link Embed Utama (Full URL)");
        const nim = getNumber(page, "NIM Penanggung Jawab");

        const emailProp = page.properties["Email"];
        const email =
          emailProp?.type === "email" && emailProp.email ? emailProp.email : "";

        const submissionTimeProp = page.properties["Submission time"];
        const submissionDate =
          submissionTimeProp?.type === "created_time"
            ? submissionTimeProp.created_time.split("T")[0]
            : page.created_time.split("T")[0];

        // Resolve media player details (embed and artwork)
        const media = await resolveKaryaMediaDetails(platforms, embedLink);

        return {
          id: page.id,
          slug,
          title,
          creator,
          genres,
          platform: platforms[0] || "",
          platforms,
          embedLink,
          embedUrl: media.embedUrl,
          artworkUrl: media.artworkUrl,
          nim,
          email,
          submissionDate,
          lastEdited: page.last_edited_time,
        };
      }),
    );

    return parsedEntries.sort(
      (a, b) =>
        new Date(b.submissionDate).getTime() -
        new Date(a.submissionDate).getTime(),
    );
  },
  ["notion-karya-entries"],
  { revalidate: 60, tags: ["notion-karya"] },
);

export async function fetchAgendaDatabaseId(pageId: string): Promise<string> {
  if (!pageId) return "36e3b26d-c3be-80dc-aa20-e1ee3940b466";
  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.childDatabases.length >= 1) {
      return dbs.childDatabases[0];
    }
  } catch (error) {
    console.warn(
      "[Notion fetchAgendaDatabaseId] Failed to fetch page child databases",
      error,
    );
  }
  return "36e3b26d-c3be-80dc-aa20-e1ee3940b466";
}

export const fetchAgendaDatabaseIdCached = unstable_cache(
  async (pageId: string): Promise<string> => {
    return fetchAgendaDatabaseId(pageId);
  },
  ["notion-agenda-database-id"],
  { revalidate: 60, tags: ["notion-agenda"] },
);

async function getActiveAgendaDbId(): Promise<string> {
  const pageId = process.env.NOTION_AGENDA_PAGE_ID;
  if (pageId) {
    return await fetchAgendaDatabaseIdCached(pageId);
  }
  return "36e3b26d-c3be-80dc-aa20-e1ee3940b466";
}

export const fetchEventsCollection = unstable_cache(
  async (): Promise<EventsCollection> => {
    const emptyCollection: EventsCollection = {
      upcoming: [],
      ongoing: [],
      past: [],
      announcements: [],
    };

    const activeDbId = await getActiveAgendaDbId();
    if (!activeDbId) return emptyCollection;

    const today = getTodayInJakarta();
    const results: NotionPage[] = [];
    let cursor: string | undefined;

    try {
      const dataSourceId = await resolveDataSourceIdSafe(activeDbId);
      if (!dataSourceId) return emptyCollection;

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });
        results.push(...(response.results as NotionPage[]));
        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    } catch (error) {
      console.error("[Notion fetchEventsCollection] Query failed:", error);
      return emptyCollection;
    }

    const entries = results
      .filter((page) => isEventPublished(page))
      .map((page) => mapEventPage(page, today));

    return {
      upcoming: sortEventEntries(
        entries.filter((entry) => entry.lifecycle === "upcoming"),
        "upcoming",
      ),
      ongoing: sortEventEntries(
        entries.filter((entry) => entry.lifecycle === "ongoing"),
        "ongoing",
      ),
      past: sortEventEntries(
        entries.filter((entry) => entry.lifecycle === "past"),
        "past",
      ),
      announcements: sortEventEntries(
        entries.filter((entry) => entry.lifecycle === "announcement"),
        "announcement",
      ),
    };
  },
  ["notion-events-collection"],
  { revalidate: 60, tags: ["notion-events"] },
);

export const fetchAllEventEntries = unstable_cache(
  async (): Promise<EventEntryMeta[]> => {
    const collection = await fetchEventsCollection();
    return [
      ...collection.upcoming,
      ...collection.ongoing,
      ...collection.past,
      ...collection.announcements,
    ];
  },
  ["notion-events-all"],
  { revalidate: 60, tags: ["notion-events"] },
);

export const fetchEventBySlug = cache(
  async (
    slug: string,
    options?: { allowPreview?: boolean },
  ): Promise<{ meta: EventEntryMeta; blocks: NotionBlock[] } | null> => {
    const activeDbId = await getActiveAgendaDbId();
    if (!activeDbId) return null;

    const normalizedSlug = slug.trim().toLowerCase();
    const today = getTodayInJakarta();

    let matchedPage: NotionPage | undefined;
    let cursor: string | undefined;

    try {
      const dataSourceId = await resolveDataSourceIdSafe(activeDbId);
      if (!dataSourceId) return null;

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });

        const page = (response.results as NotionPage[]).find((entry) => {
          const title =
            getTitleProperty(entry, "Nama Acara") ||
            getTitleProperty(entry, "Judul Tayangan") ||
            getTitleProperty(entry, "Name") ||
            getTitle(entry);
          const entrySlug = (
            getRichText(entry, "Request Slug Khusus") ||
            getSlugValue(entry, title)
          )
            .trim()
            .toLowerCase();

          const isPublished = isEventPublished(entry);
          const isPreviewable = options?.allowPreview
            ? isEventPreviewable(entry)
            : false;

          return entrySlug === normalizedSlug && (isPublished || isPreviewable);
        });

        if (page) {
          matchedPage = page;
          break;
        }

        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    } catch (error) {
      console.error("[Notion fetchEventBySlug] Query failed:", error);
      return null;
    }

    if (!matchedPage) return null;

    const rootBlocks = await fetchAllBlocks(matchedPage.id);
    const blocks = selectEventContentBlocks(rootBlocks);

    return {
      meta: mapEventPage(matchedPage, today),
      blocks,
    };
  },
);

export async function fetchEventCoverUrlBySlug(
  slug: string,
): Promise<string | null> {
  const activeDbId = await getActiveAgendaDbId();
  if (!activeDbId) return null;

  const normalizedSlug = slug.trim().toLowerCase();
  let cursor: string | undefined;

  try {
    const dataSourceId = await resolveDataSourceIdSafe(activeDbId);
    if (!dataSourceId) return null;

    do {
      const response = await getNotionClientAny().dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: cursor,
      });

      const page = (response.results as NotionPage[]).find((entry) => {
        const title =
          getTitleProperty(entry, "Nama Acara") ||
          getTitleProperty(entry, "Judul Tayangan") ||
          getTitleProperty(entry, "Name") ||
          getTitle(entry);
        const entrySlug = (
          getRichText(entry, "Request Slug Khusus") ||
          getSlugValue(entry, title)
        )
          .trim()
          .toLowerCase();
        return entrySlug === normalizedSlug && isEventPublished(entry);
      });

      if (page) {
        return getFiles(page, "Gambar")[0] || getCoverUrl(page);
      }

      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);
  } catch (error) {
    console.error("[Notion fetchEventCoverUrlBySlug] Query failed:", error);
  }

  return null;
}

export const fetchDocBySlug = cache(
  async (
    slug: string,
  ): Promise<{ meta: DocMeta; blocks: NotionBlock[] } | null> => {
    const pageId = NOTION_SEKRETARIAT_PAGE_ID;
    let docsDbId = DOCS_DB_ID;
    let categoriesDbId = "";

    if (pageId) {
      const resolved = await resolveSekretariatDatabasesCached(pageId);
      docsDbId = resolved.docsDbId;
      categoriesDbId = resolved.categoriesDbId;
    }

    if (!docsDbId) return null;

    const categories = categoriesDbId
      ? await fetchSekretariatCategories(categoriesDbId)
      : [];

    const categoryMap = new Map<string, SekretariatCategory>(
      categories.map((c) => [normalizeNotionId(c.id), c]),
    );

    const normalizedSlug = slug.trim().toLowerCase();
    let matchedPage: NotionPage | undefined;
    let cursor: string | undefined;

    try {
      const dataSourceId = await resolveDataSourceIdSafe(docsDbId);
      if (!dataSourceId) return null;

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });

        const page = (response.results as NotionPage[]).find((entry) => {
          const entrySlug = (getRichText(entry, "Slug") || entry.id)
            .trim()
            .toLowerCase();
          const status =
            getStatus(entry, "Status") || getStatus(entry, "Status Konten CMS");
          const published = status
            ? status === "Publish" || status === "Live"
            : getCheckbox(entry, "Publish", true);
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
    } catch (error) {
      console.error("[Notion fetchDocBySlug] Query failed:", error);
      return null;
    }

    const page = matchedPage;
    if (!page) return null;

    const blocks = await fetchAllBlocks(page.id);
    const title =
      getTitleProperty(page, "Nama Dokumen") ||
      getTitleProperty(page, "Name") ||
      getTitle(page);

    const relationIds = getRelationIds(page, "Kategori");
    let category = "";
    if (relationIds.length > 0) {
      category =
        relationIds
          .map((id) => categoryMap.get(normalizeNotionId(id))?.name)
          .filter(Boolean)[0] || "";
    }
    if (!category) {
      category =
        getSelect(page, "Kategori") || getSelect(page, "Category") || "Umum";
    }

    const status =
      getStatus(page, "Status") || getStatus(page, "Status Konten CMS");
    const isPublished = status
      ? status === "Publish" || status === "Live"
      : getCheckbox(page, "Publish", true);

    return {
      meta: {
        id: page.id,
        slug: getRichText(page, "Slug") || page.id,
        title,
        category,
        icon: page.icon?.type === "emoji" ? page.icon.emoji : null,
        order:
          getNumber(page, "Urutan Tampil") ?? getNumber(page, "Order") ?? 999,
        createdAt: page.created_time,
        lastEdited: page.last_edited_time,
        published: isPublished,
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
    const pageId = NOTION_SEKRETARIAT_PAGE_ID;
    let docsDbId = DOCS_DB_ID;

    if (pageId) {
      const resolved = await resolveSekretariatDatabasesCached(pageId);
      docsDbId = resolved.docsDbId;
    }

    if (!docsDbId) return [];

    const normalizedTag = tag?.trim().toLowerCase();
    const results: NotionPage[] = [];
    let cursor: string | undefined;

    try {
      const dataSourceId = await resolveDataSourceIdSafe(docsDbId);
      if (!dataSourceId) return [];

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });
        results.push(...(response.results as NotionPage[]));
        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    } catch (error) {
      console.error("[Notion fetchArchives] Query failed:", error);
      return [];
    }

    return results
      .filter((page) => {
        const status =
          getStatus(page, "Status") || getStatus(page, "Status Konten CMS");
        if (status !== "Arsip") return false;

        if (!normalizedTag) return true;
        const tags = getMultiSelect(page, "Tags");
        return tags.some((entryTag) =>
          entryTag.toLowerCase().includes(normalizedTag),
        );
      })
      .map((page) => {
        const title =
          getTitleProperty(page, "Nama Dokumen") ||
          getTitleProperty(page, "Name") ||
          getTitle(page);

        return {
          id: page.id,
          title,
          summary:
            getRichText(page, "Summary") || getRichText(page, "Slug") || "",
          date: getDate(page, "Date") || page.created_time.split("T")[0],
          tags: getMultiSelect(page, "Tags"),
          published: true,
        };
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
  try {
    const page = (await getNotionClient().pages.retrieve({
      page_id: id,
    })) as NotionPage;

    const status =
      getStatus(page, "Status") || getStatus(page, "Status Konten CMS");
    const isArchived = status === "Arsip";

    if (!isArchived) return null;

    const blocks = await fetchAllBlocks(page.id);
    const title =
      getTitleProperty(page, "Nama Dokumen") ||
      getTitleProperty(page, "Name") ||
      getTitle(page);

    return {
      entry: {
        id: page.id,
        title,
        summary:
          getRichText(page, "Summary") || getRichText(page, "Slug") || "",
        date: getDate(page, "Date") || page.created_time.split("T")[0],
        tags: getMultiSelect(page, "Tags"),
        published: true,
      },
      blocks,
    };
  } catch (error) {
    console.error("[Notion fetchArchiveById] Query failed:", error);
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

    try {
      do {
        const response = await getNotionClient().blocks.children.list({
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
    } catch (error) {
      console.error("[Notion fetchAllBlocks] Query failed:", error);
    }

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

  try {
    const response = await getNotionClient().search({
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
      const title =
        getTitleProperty(page, "Nama Dokumen") ||
        getTitleProperty(page, "Name") ||
        getTitle(page);
      const slug = getRichText(page, "Slug") || page.id;
      const category =
        getSelect(page, "Kategori") || getSelect(page, "Category");

      results.push({
        id: page.id,
        title,
        slug,
        category,
        highlight: title,
      });
    }

    return results;
  } catch (error) {
    console.error("[Notion searchDocs] Search failed:", error);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Beranda & Profil database resolution helpers                       */
/* ------------------------------------------------------------------ */

export async function resolveBerandaDatabases(
  pageId: string,
): Promise<{ heroDbId: string; jelajahiDbId: string }> {
  const result = {
    heroDbId: "36e3b26d-c3be-802c-aac0-c7dbcd40ef36",
    jelajahiDbId: "36e3b26d-c3be-802c-91ac-e5ed573d89f6",
  };
  if (!pageId) return result;
  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.childDatabases.length >= 1) {
      result.heroDbId = dbs.childDatabases[0];
    }
    if (dbs.childDatabases.length >= 2) {
      result.jelajahiDbId = dbs.childDatabases[1];
    }
  } catch (error) {
    console.warn("[Notion resolveBerandaDatabases] Failed", error);
  }
  return result;
}

export const resolveBerandaDatabasesCached = unstable_cache(
  async (
    pageId: string,
  ): Promise<{ heroDbId: string; jelajahiDbId: string }> => {
    return resolveBerandaDatabases(pageId);
  },
  ["notion-beranda-databases"],
  { revalidate: 60, tags: ["notion-beranda"] },
);

export async function resolveProfilDatabases(
  pageId: string,
): Promise<{ sectionDbId: string; kabinetDbId: string; sdmDbId: string }> {
  const result = {
    sectionDbId: "36e3b26d-c3be-8076-9a94-d776ed290943",
    kabinetDbId: "36e3b26d-c3be-804e-b7da-f0a1f98f218e",
    sdmDbId: "35c3b26d-c3be-8021-b84a-df0a98e7b1e1",
  };
  if (!pageId) return result;
  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.childDatabases.length >= 1) {
      result.sectionDbId = dbs.childDatabases[0];
    }
    if (dbs.childDatabases.length >= 2) {
      result.kabinetDbId = dbs.childDatabases[1];
    }
    if (dbs.mentionedDatabases.length >= 1) {
      result.sdmDbId = dbs.mentionedDatabases[0];
    }
  } catch (error) {
    console.warn("[Notion resolveProfilDatabases] Failed", error);
  }
  return result;
}

export const resolveProfilDatabasesCached = unstable_cache(
  async (
    pageId: string,
  ): Promise<{ sectionDbId: string; kabinetDbId: string; sdmDbId: string }> => {
    return resolveProfilDatabases(pageId);
  },
  ["notion-profil-databases"],
  { revalidate: 60, tags: ["notion-profil"] },
);

/* ------------------------------------------------------------------ */
/*  Modular Beranda database queries                                  */
/* ------------------------------------------------------------------ */

export interface BerandaModularItem {
  id: string;
  buttonTitle: string;
  description: string;
  visible: boolean;
  redirect: string;
  urutan: number;
}

export interface BerandaModularData {
  heroSection: BerandaModularItem[];
  jelajahi: BerandaModularItem[];
}

export async function fetchModularDatabase(
  dbId: string,
): Promise<BerandaModularItem[]> {
  const dataSourceId = await resolveDataSourceIdSafe(dbId);
  if (!dataSourceId) return [];

  const results: NotionPage[] = [];
  let cursor: string | undefined;

  try {
    do {
      const response = await getNotionClientAny().dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: cursor,
      });
      results.push(...(response.results as NotionPage[]));
      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);
  } catch (error) {
    console.error(
      `[Notion fetchModularDatabase] Query failed for ${dbId}:`,
      error,
    );
    return [];
  }

  return results
    .map((page) => {
      const buttonTitle =
        getTitleProperty(page, "Button Title") ||
        getTitleProperty(page, "Name") ||
        getTitle(page);
      const description = getRichText(page, "Description");
      const visible = getCheckbox(page, "Visible", true);
      const redirect = getRichText(page, "Redirect");
      const urutan =
        getNumber(page, "Urutan") !== 999
          ? getNumber(page, "Urutan")
          : getNumber(page, "Urutan Tampil") !== 999
            ? getNumber(page, "Urutan Tampil")
            : 999;

      return {
        id: page.id,
        buttonTitle,
        description,
        visible,
        redirect,
        urutan,
      };
    })
    .filter((item) => item.visible)
    .sort((a, b) => a.urutan - b.urutan);
}

export async function fetchBerandaModularData(
  pageId: string,
): Promise<BerandaModularData> {
  const data: BerandaModularData = {
    heroSection: [],
    jelajahi: [],
  };

  if (!pageId) return data;

  let foundHeroDbId = "36e3b26d-c3be-802c-aac0-c7dbcd40ef36";
  let foundJelajahiDbId = "36e3b26d-c3be-802c-91ac-e5ed573d89f6";

  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.childDatabases.length >= 1) {
      foundHeroDbId = dbs.childDatabases[0];
    }
    if (dbs.childDatabases.length >= 2) {
      foundJelajahiDbId = dbs.childDatabases[1];
    }
  } catch (error) {
    console.warn(
      "[Notion fetchBerandaModularData] Could not fetch page children blocks, falling back to static/configured database IDs",
      error,
    );
  }

  const [heroItems, jelajahiItems] = await Promise.all([
    fetchModularDatabase(foundHeroDbId),
    fetchModularDatabase(foundJelajahiDbId),
  ]);

  data.heroSection = heroItems;
  data.jelajahi = jelajahiItems;

  return data;
}

export const fetchBerandaModularDataCached = unstable_cache(
  async (pageId: string): Promise<BerandaModularData> => {
    return fetchBerandaModularData(pageId);
  },
  ["notion-beranda-modular-data"],
  { revalidate: 60, tags: ["notion-beranda"] },
);

/* ------------------------------------------------------------------ */
/*  Modular Profil database queries                                   */
/* ------------------------------------------------------------------ */

export interface ProfilModularExecutive {
  role: string;
  name: string;
}

export interface ProfilModularDivision {
  name: string;
  members: string[];
  slots: number;
  openPositions: string[];
}

export interface ProfilModularData {
  paragraph: string;
  cabinetName: string;
  executives: ProfilModularExecutive[];
  divisions: ProfilModularDivision[];
}

export interface ProfilOrgQuery {
  sdmDatabaseId: string;
  maxBatch?: number;
}

export async function fetchProfilOrgStructure(
  query: ProfilOrgQuery,
): Promise<ProfilModularData> {
  const data: ProfilModularData = {
    paragraph: "",
    cabinetName: "",
    executives: [],
    divisions: [],
  };

  const sdmDatabaseId = normalizeNotionId(query.sdmDatabaseId?.trim() ?? "");
  if (!sdmDatabaseId) return data;

  const maxBatch = query.maxBatch ?? 999;

  try {
    const sdmDataSourceId = await resolveDataSourceIdSafe(sdmDatabaseId);
    const sdmPages: any[] = [];
    if (sdmDataSourceId) {
      let cursor: string | undefined;
      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: sdmDataSourceId,
          start_cursor: cursor,
        });
        sdmPages.push(...response.results);
        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);
    }

    // Filter by Keaktifan and Batch
    const filteredMembers = sdmPages.filter((page) => {
      const status = getSelect(page, "Status Keaktifan");
      if (
        status === "Diberhentikan" ||
        status === "Demisioner" ||
        status === "Cuti"
      ) {
        return false;
      }

      const batchStr = getSelect(page, "Batch") || "";
      const match = batchStr.match(/Batch (\d+)/i);
      const batchNum = match ? parseInt(match[1], 10) : 999;
      return batchNum <= maxBatch;
    });

    // Collect all referenced division IDs
    const divIds = Array.from(
      new Set(
        filteredMembers.flatMap((page) => {
          const prop = getProperty(page, "Divisi") as any;
          if (prop?.type === "relation") {
            return prop.relation.map((r: any) => r.id);
          }
          return [];
        }),
      ),
    ) as string[];

    // Fetch referenced division names in parallel
    const divisionMap = new Map<string, string>();
    await Promise.all(
      divIds.map(async (id) => {
        try {
          const divPage = await getNotionClient().pages.retrieve({
            page_id: id,
          });
          const titleProp = Object.values((divPage as any).properties).find(
            (p: any) => p.type === "title",
          ) as any;
          const name = titleProp?.title?.[0]?.plain_text || "Unnamed Division";
          divisionMap.set(id, name);
        } catch (err) {
          console.error(
            `Failed to fetch division details for page ${id}:`,
            err,
          );
        }
      }),
    );

    // Map members to a clean structure
    const parsedMembers = filteredMembers.map((page) => {
      const name =
        getTitleProperty(page, "Nama Lengkap Staf") || getTitle(page);
      const roles = getMultiSelect(page, "Jabatan Kabinet");
      const status = getSelect(page, "Status Keaktifan");

      const divProp = getProperty(page, "Divisi") as any;
      const divPageId =
        divProp?.type === "relation" ? divProp.relation?.[0]?.id : null;
      const divisionName = divPageId ? divisionMap.get(divPageId) || "" : "";

      const isOpen =
        status === "Rekrutmen" ||
        name.toLowerCase().includes("[open position]");

      return {
        id: page.id,
        name,
        roles,
        divisionName,
        isOpen,
      };
    });

    // Separate BPH vs Divisions
    const bphMembers = parsedMembers.filter(
      (m) =>
        m.divisionName.toLowerCase() === "bph" ||
        m.roles.some((r) => /ketua|wakil|sekretaris|bendahara/i.test(r)),
    );
    const divisionMembers = parsedMembers.filter(
      (m) =>
        m.divisionName.toLowerCase() !== "bph" &&
        !m.roles.some((r) => /ketua|wakil|sekretaris|bendahara/i.test(r)),
    );

    // Map executives for OrgChart
    const execMap = new Map<string, string>();

    // Symmetrically determine BPH role limits by looking at entire sdmPages data structure
    const isRoleInBatchRange = (roleRegex: RegExp) => {
      return sdmPages.some((page) => {
        const roles = getMultiSelect(page, "Jabatan Kabinet");
        const batchStr = getSelect(page, "Batch") || "";
        const match = batchStr.match(/Batch (\d+)/i);
        const batchNum = match ? parseInt(match[1], 10) : 999;
        return roles.some((r) => roleRegex.test(r)) && batchNum <= maxBatch;
      });
    };

    if (isRoleInBatchRange(/ketua/i))
      execMap.set("ketua", "[OPEN POSITION] - Ketua");
    if (isRoleInBatchRange(/wakil/i))
      execMap.set("wakil", "[OPEN POSITION] - Wakil Ketua");
    if (isRoleInBatchRange(/sekretaris/i))
      execMap.set("sekretaris", "[OPEN POSITION] - Sekretaris");
    if (isRoleInBatchRange(/sekretaris muda|co-sekretaris/i))
      execMap.set("co-sekretaris", "[OPEN POSITION] - Co-Sekretaris");
    if (isRoleInBatchRange(/bendahara/i))
      execMap.set("bendahara", "[OPEN POSITION] - Bendahara");
    if (isRoleInBatchRange(/bendahara muda|co-bendahara/i))
      execMap.set("co-bendahara", "[OPEN POSITION] - Co-Bendahara");

    // Populate roles
    for (const m of bphMembers) {
      for (const r of m.roles) {
        const lower = r.toLowerCase();
        if (lower === "ketua") {
          execMap.set("ketua", m.name);
        } else if (lower.includes("wakil")) {
          execMap.set("wakil", m.name);
        } else if (lower === "sekretaris") {
          execMap.set("sekretaris", m.name);
        } else if (
          lower.includes("sekretaris muda") ||
          lower.includes("co-sekretaris")
        ) {
          execMap.set("co-sekretaris", m.name);
        } else if (lower === "bendahara") {
          execMap.set("bendahara", m.name);
        } else if (
          lower.includes("bendahara muda") ||
          lower.includes("co-bendahara")
        ) {
          execMap.set("co-bendahara", m.name);
        }
      }
    }

    data.executives = [];
    if (execMap.has("ketua"))
      data.executives.push({
        role: "Ketua Himpunan",
        name: execMap.get("ketua")!,
      });
    if (execMap.has("wakil"))
      data.executives.push({
        role: "Wakil Ketua",
        name: execMap.get("wakil")!,
      });
    if (execMap.has("sekretaris"))
      data.executives.push({
        role: "Sekretaris",
        name: execMap.get("sekretaris")!,
      });
    if (execMap.has("co-sekretaris"))
      data.executives.push({
        role: "Co-Sekretaris",
        name: execMap.get("co-sekretaris")!,
      });
    if (execMap.has("bendahara"))
      data.executives.push({
        role: "Bendahara",
        name: execMap.get("bendahara")!,
      });
    if (execMap.has("co-bendahara"))
      data.executives.push({
        role: "Co-Bendahara",
        name: execMap.get("co-bendahara")!,
      });

    // Group divisions dynamically
    const divGroups = new Map<
      string,
      { members: string[]; slots: number; openPositions: string[] }
    >();

    // Add all unique referenced non-BPH division names to map
    for (const name of divisionMap.values()) {
      if (name.toLowerCase() !== "bph") {
        divGroups.set(name, { members: [], slots: 0, openPositions: [] });
      }
    }

    for (const m of divisionMembers) {
      if (!m.divisionName || m.divisionName.toLowerCase() === "bph") continue;

      let group = divGroups.get(m.divisionName);
      if (!group) {
        group = { members: [], slots: 0, openPositions: [] };
        divGroups.set(m.divisionName, group);
      }

      if (m.isOpen) {
        group.slots += 1;
        let cleanRole = m.name.replace(/^\[OPEN POSITION\]\s*-\s*/i, "").trim();
        const specificRole = m.roles.find(
          (r) => !/staf penuh|staf muda/i.test(r),
        );
        if (specificRole) {
          cleanRole = specificRole;
        }
        group.openPositions.push(cleanRole);
      } else {
        group.members.push(m.name);
      }
    }

    data.divisions = Array.from(divGroups.entries()).map(([name, group]) => ({
      name,
      members: group.members,
      slots: group.slots,
      openPositions: group.openPositions,
    }));
  } catch (error) {
    console.error(
      "[Notion fetchProfilOrgStructure] Failed to process database content:",
      error,
    );
  }

  return data;
}

/** @deprecated Use fetchProfilOrgStructure with CMS database IDs instead. */
export async function fetchProfilModularData(
  _pageId: string,
): Promise<ProfilModularData> {
  const {
    fetchContainerCMSCached,
    resolveCmsComponentDatabaseId,
    resolveProfilMaxBatchFromCms,
  } = await import("./notion-builder");
  const cms = await fetchContainerCMSCached();
  const sdmDatabaseId = resolveCmsComponentDatabaseId(
    cms,
    "Struktur Organisasi Graph",
    "value2",
  );
  if (!sdmDatabaseId)
    return { paragraph: "", cabinetName: "", executives: [], divisions: [] };
  return fetchProfilOrgStructure({
    sdmDatabaseId,
    maxBatch: resolveProfilMaxBatchFromCms(cms),
  });
}

export const fetchProfilOrgStructureCached = unstable_cache(
  async (query: ProfilOrgQuery): Promise<ProfilModularData> => {
    return fetchProfilOrgStructure(query);
  },
  ["notion-profil-org-structure"],
  { revalidate: 60, tags: ["notion-profil"] },
);

export const fetchProfilModularDataCached = unstable_cache(
  async (pageId: string): Promise<ProfilModularData> => {
    return fetchProfilModularData(pageId);
  },
  ["notion-profil-modular-data"],
  { revalidate: 60, tags: ["notion-profil"] },
);

/* ------------------------------------------------------------------ */
/*  Modular Redirect database queries                                 */
/* ------------------------------------------------------------------ */

export interface RedirectEntry {
  id: string;
  name: string;
  sourcePath: string;
  destinationUrl: string;
}

export async function fetchRedirectDatabaseId(pageId: string): Promise<string> {
  if (!pageId) return "";
  try {
    const dbs = await fetchPageDatabases(pageId);
    if (dbs.childDatabases.length >= 1) {
      return dbs.childDatabases[0];
    }
  } catch (error) {
    console.warn(
      "[Notion fetchRedirectDatabaseId] Failed to fetch page child databases",
      error,
    );
  }
  return "";
}

export const fetchRedirectDatabaseIdCached = unstable_cache(
  async (pageId: string): Promise<string> => {
    return fetchRedirectDatabaseId(pageId);
  },
  ["notion-redirect-database-id"],
  { revalidate: 60, tags: ["notion-redirects"] },
);

export const fetchRedirects = unstable_cache(
  async (): Promise<RedirectEntry[]> => {
    const pageId = process.env.NOTION_REDIRECT_PAGE_ID;
    if (!pageId) return [];

    try {
      const activeDbId = await fetchRedirectDatabaseIdCached(pageId);
      if (!activeDbId) return [];

      const dataSourceId = await resolveDataSourceIdSafe(activeDbId);
      if (!dataSourceId) return [];

      const results: NotionPage[] = [];
      let cursor: string | undefined;

      do {
        const response = await getNotionClientAny().dataSources.query({
          data_source_id: dataSourceId,
          start_cursor: cursor,
        });
        results.push(...(response.results as NotionPage[]));
        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);

      return results
        .map((page) => {
          const name = getTitleProperty(page, "Name") || getTitle(page);
          const sourcePath = getRichText(page, "Modified");
          const destinationUrl = getRichText(page, "Destination URL");

          return {
            id: page.id,
            name,
            sourcePath: sourcePath.trim(),
            destinationUrl: destinationUrl.trim(),
          };
        })
        .filter((entry) => entry.sourcePath && entry.destinationUrl);
    } catch (error) {
      console.error("[Notion fetchRedirects] Query failed:", error);
      return [];
    }
  },
  ["notion-redirects"],
  { revalidate: 60, tags: ["notion-redirects"] },
);
