import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  QueryDataSourceResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { classifyEventLifecycle, getEventDateSortValue } from "./event-dates";
import { KKM_ENTRY_ORDER, type KKMGroup } from "./kkm-data";
import {
  ArchiveEntry,
  buildAnchorMap,
  DocMeta,
  NotionBlock,
  NotionPage,
  stripCustomTags,
} from "./notion-shared";

export * from "./notion-shared";

export type NotionContentScope = "sekretariat" | "kkm" | "events";

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
  coverImageUrl: string | null;
  lifecycle: EventLifecycle;
}

export interface EventsCollection {
  upcoming: EventEntryMeta[];
  ongoing: EventEntryMeta[];
  past: EventEntryMeta[];
  announcements: EventEntryMeta[];
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
    throw new Error("Missing NOTION_INTEGRATION_TOKEN environment variable");
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
function getTitle(page: NotionPage): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return stripCustomTags(prop.title.map((t) => t.plain_text).join(""));
    }
  }
  return "Untitled";
}

function getTitleProperty(page: NotionPage, name: string): string {
  const prop = page.properties[name];
  if (prop?.type === "title" && prop.title.length > 0) {
    return stripCustomTags(prop.title.map((t) => t.plain_text).join(""));
  }
  return "";
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

function getDateEnd(page: NotionPage, name: string): string {
  const prop = page.properties[name];
  if (prop?.type === "date" && prop.date?.end) {
    return prop.date.end;
  }
  return "";
}

function getUrl(page: NotionPage, name: string): string {
  const prop = page.properties[name];
  if (prop?.type === "url" && prop.url) {
    return prop.url.trim();
  }
  return "";
}

function getFormulaString(page: NotionPage, name: string): string {
  const prop = page.properties[name];
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
  const prop = page.properties[name];
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
  if (!getCheckbox(page, "Publish", true)) return false;
  return true;
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

const DOCS_DB_ID =
  process.env.NOTION_SEKRETARIAT_DATABASE_ID ??
  process.env.NOTION_PROJECT_DATABASE_ID ??
  "";

const dataSourceIdCache = new Map<string, string>();
const warnedDatabaseIds = new Set<string>();

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

async function resolveDataSourceIdSafe(id: string): Promise<string | null> {
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

export const fetchAllDocs = unstable_cache(
  async (): Promise<DocMeta[]> => {
    if (!DOCS_DB_ID) return [];

    const docsDataSourceId = await resolveDataSourceIdSafe(DOCS_DB_ID);
    if (!docsDataSourceId) return [];
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
        createdAt: page.created_time,
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

/* ------------------------------------------------------------------ */
/*  KKM database queries                                               */
/* ------------------------------------------------------------------ */

const KKM_DB_ID = process.env.NOTION_KKM_DATABASE_ID ?? "";
const EVENTS_DB_ID = process.env.NOTION_EVENTS_DATABASE_ID ?? "";

export const fetchKKMGroups = unstable_cache(
  async (): Promise<KKMGroup[]> => {
    if (!KKM_DB_ID) return [];

    const kkmDataSourceId = await resolveDataSourceIdSafe(KKM_DB_ID);
    if (!kkmDataSourceId) return [];
    const results: NotionPage[] = [];
    let cursor: string | undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: kkmDataSourceId,
        start_cursor: cursor,
      });
      results.push(...(response.results as NotionPage[]));
      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);

    const kkmMap = new Map<string, KKMGroup>();
    const extraGroups: KKMGroup[] = [];

    for (const page of results) {
      const name = (getTitleProperty(page, "Name") || getTitle(page)).trim();
      if (!name) {
        continue;
      }

      const richTextLinks = getRichText(page, "Link Sosmed");
      const urlLink = getUrl(page, "Link Sosmed");
      const socialLinks = (richTextLinks || urlLink)
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);

      const group = {
        slug: getRichText(page, "Slug") || slugify(name),
        name,
        tagline: getRichText(page, "Jargon"),
        description: getRichText(page, "Deskripsi Singkat"),
        socialLinks,
      };

      if (KKM_ENTRY_ORDER.includes(name as (typeof KKM_ENTRY_ORDER)[number])) {
        kkmMap.set(name, group);
      } else {
        extraGroups.push(group);
      }
    }

    const orderedGroups = KKM_ENTRY_ORDER.map((name) =>
      kkmMap.get(name),
    ).filter((entry): entry is KKMGroup => Boolean(entry));

    extraGroups.sort((a, b) =>
      a.name.localeCompare(b.name, "id", { sensitivity: "base" }),
    );

    return [...orderedGroups, ...extraGroups];
  },
  ["notion-kkm-groups"],
  { revalidate: 60, tags: ["notion-kkm"] },
);

export const fetchKKMEntryBySlug = cache(
  async (
    slug: string,
  ): Promise<{ meta: DocMeta; blocks: NotionBlock[] } | null> => {
    if (!KKM_DB_ID) return null;

    const kkmDataSourceId = await resolveDataSourceIdSafe(KKM_DB_ID);
    if (!kkmDataSourceId) return null;
    const normalizedSlug = slug.trim().toLowerCase();

    let matchedPage: NotionPage | undefined;
    let cursor: string | undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: kkmDataSourceId,
        start_cursor: cursor,
      });

      const page = (response.results as NotionPage[]).find((entry) => {
        const name = (
          getTitleProperty(entry, "Name") || getTitle(entry)
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

    if (!matchedPage) return null;

    const name = (
      getTitleProperty(matchedPage, "Name") || getTitle(matchedPage)
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
  const title = getTitleProperty(page, "Name") || getTitle(page);
  const slug = getSlugValue(page, title);
  const eventDate = getDate(page, "Event Date");
  const eventDateEnd = getDateEnd(page, "Event Date");
  const entryKind =
    getSelect(page, "Entry Kind") || (eventDate ? "Event" : "Announcement");
  const lifecycle = classifyEventLifecycle(
    entryKind,
    { start: eventDate, end: eventDateEnd },
    today,
  );

  return {
    id: page.id,
    slug,
    title,
    category: "Events",
    icon: page.icon?.type === "emoji" ? page.icon.emoji : null,
    order: 999,
    createdAt: page.created_time,
    lastEdited: page.last_edited_time,
    published: getCheckbox(page, "Publish", true),
    summary: getRichText(page, "Summary"),
    ownerUnit: getSelect(page, "Owner Unit"),
    entryKind,
    eventDate,
    eventDateEnd,
    location: getRichText(page, "Location"),
    registrationLink: getUrl(page, "Registration Link"),
    coverImageUrl: getCoverUrl(page),
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

export const fetchEventsCollection = unstable_cache(
  async (): Promise<EventsCollection> => {
    const emptyCollection: EventsCollection = {
      upcoming: [],
      ongoing: [],
      past: [],
      announcements: [],
    };

    if (!EVENTS_DB_ID) return emptyCollection;

    const today = getTodayInJakarta();
    const eventsDataSourceId = await resolveDataSourceIdSafe(EVENTS_DB_ID);
    if (!eventsDataSourceId) return emptyCollection;
    const results: NotionPage[] = [];
    let cursor: string | undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: eventsDataSourceId,
        start_cursor: cursor,
      });
      results.push(...(response.results as NotionPage[]));
      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);

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
  ): Promise<{ meta: EventEntryMeta; blocks: NotionBlock[] } | null> => {
    if (!EVENTS_DB_ID) return null;

    const eventsDataSourceId = await resolveDataSourceIdSafe(EVENTS_DB_ID);
    if (!eventsDataSourceId) return null;
    const normalizedSlug = slug.trim().toLowerCase();
    const today = getTodayInJakarta();

    let matchedPage: NotionPage | undefined;
    let cursor: string | undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: eventsDataSourceId,
        start_cursor: cursor,
      });

      const page = (response.results as NotionPage[]).find((entry) => {
        const title = getTitleProperty(entry, "Name") || getTitle(entry);
        const entrySlug = getSlugValue(entry, title).trim().toLowerCase();
        return entrySlug === normalizedSlug && isEventPublished(entry);
      });

      if (page) {
        matchedPage = page;
        break;
      }

      cursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (cursor);

    if (!matchedPage) return null;

    const blocks = await fetchAllBlocks(matchedPage.id);

    return {
      meta: mapEventPage(matchedPage, today),
      blocks,
    };
  },
);

export const fetchDocBySlug = cache(
  async (
    slug: string,
  ): Promise<{ meta: DocMeta; blocks: NotionBlock[] } | null> => {
    if (!DOCS_DB_ID) return null;

    const docsDataSourceId = await resolveDataSourceIdSafe(DOCS_DB_ID);
    if (!docsDataSourceId) return null;
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
        createdAt: page.created_time,
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

    const docsDataSourceId = await resolveDataSourceIdSafe(DOCS_DB_ID);
    if (!docsDataSourceId) return [];
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
