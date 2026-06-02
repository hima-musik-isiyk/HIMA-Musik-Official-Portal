import { unstable_cache as next_unstable_cache } from "next/cache";
import { headers } from "next/headers";

import {
  fetchPageChildDatabases,
  fetchPageDatabases,
  getNotionClient,
  NotionPage,
  resolveDataSourceIdSafe,
} from "./notion";

// Custom cache wrapper with environment-aware revalidation strategy:
// - Development: 1 second → instant page reloads when editing Notion locally.
// - Production:  5 seconds cap → pages are served from cache instantly, but revalidated
//   very frequently in the background, keeping page transitions extremely snappy.
// - Reload Bypass: Detects cache-control/pragma 'no-cache' and fetches directly from Notion.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unstable_cache<T extends (...args: any[]) => Promise<any>>(
  cb: T,
  keyParts?: string[],
  options?: { revalidate?: number | false; tags?: string[] },
): T {
  const revalVal =
    process.env.NODE_ENV !== "production" ? 1 : (options?.revalidate ?? false);

  const cachedFn = next_unstable_cache(cb, keyParts, {
    ...options,
    revalidate: revalVal,
  });

  return (async (...args: any[]) => {
    try {
      const reqHeaders = await headers();
      const cacheControl = reqHeaders.get("cache-control");
      const pragma = reqHeaders.get("pragma");
      if (cacheControl === "no-cache" || pragma === "no-cache") {
        return cb(...args);
      }
    } catch {
      // Safely ignore during prerendering/static compilation
    }
    return cachedFn(...args);
  }) as unknown as T;
}

export interface CMSVariable {
  variable: string;
  value: string;
}

export interface CMSGroupCategory {
  id: string;
  name: string;
  type: string;
}

export interface CMSFooterComponent {
  id: string;
  name: string;
  show: boolean;
  group: string;
}

export interface CMSComponentRegistry {
  id: string;
  type: string;
  name: string;
  variation1: string;
  variation2: string;
  variation3: string;
  value1: string;
  value2: string;
  value3: string;
}

export interface CMSComponent {
  id: string;
  typeId: string;
  variation: string;
  groupId: string;
  show: boolean;
  orderOrGroup: string;
  value: string;
  value2: string;
  value3: string;
}

export interface CMSSection {
  id: string;
  pageId: string;
  sectionName: string;
  slug: string;
  order: string;
  show: boolean;
  height: string;
  components: CMSComponent[];
}

export interface CMSPage {
  id: string;
  name: string;
  slug: string;
  type: string;
  showInNav: boolean;
  urutan: string;
  showFooter: boolean;
  sections: CMSSection[];
  maxWidth?: string;
}

export interface CMSRedirect {
  id: string;
  name: string;
  modified: string;
  destinationUrl: string;
}

export interface ContainerCMSData {
  pages: CMSPage[];
  variables: Record<string, string>;
  groupCategories: Record<string, CMSGroupCategory>;
  componentRegistry: Record<string, CMSComponentRegistry>;
  footer: CMSFooterComponent[];
  redirects: CMSRedirect[];
}

// Property helpers
type RichTextFragment = { plain_text: string };
type RelationFragment = { id: string };

function getTitle(page: NotionPage, name: string): string {
  const prop = page.properties[name] || page.properties[name.toLowerCase()];
  if (prop?.type === "title" && prop.title.length > 0) {
    return prop.title
      .map((t: RichTextFragment) => t.plain_text)
      .join("")
      .trim();
  }
  return "";
}

function getRichText(page: NotionPage, name: string): string {
  const prop = page.properties[name] || page.properties[name.toLowerCase()];
  if (prop?.type === "rich_text" && prop.rich_text) {
    return prop.rich_text
      .map((t: RichTextFragment) => t.plain_text)
      .join("")
      .trim();
  }
  return "";
}

function getSelect(page: NotionPage, name: string): string {
  const prop = page.properties[name] || page.properties[name.toLowerCase()];
  if (prop?.type === "select" && prop.select) {
    return prop.select.name;
  }
  return "";
}

function getCheckbox(
  page: NotionPage,
  name: string,
  defaultValue = false,
): boolean {
  const prop = page.properties[name] || page.properties[name.toLowerCase()];
  if (prop?.type === "checkbox") {
    return prop.checkbox;
  }
  return defaultValue;
}

function getUrl(page: NotionPage, name: string): string {
  const prop = page.properties[name] || page.properties[name.toLowerCase()];
  if (prop?.type === "url" && prop.url) {
    return prop.url;
  }
  return "";
}

function getRelationIds(page: NotionPage, name: string): string[] {
  const prop = page.properties[name] || page.properties[name.toLowerCase()];
  if (prop?.type === "relation" && Array.isArray(prop.relation)) {
    return prop.relation.map((r: RelationFragment) => r.id);
  }
  return [];
}

async function queryAll(databaseId: string): Promise<NotionPage[]> {
  const dataSourceId = await resolveDataSourceIdSafe(databaseId);
  if (!dataSourceId) return [];

  const results: NotionPage[] = [];
  let cursor: string | undefined;

  const client = getNotionClient();

  do {
    const response = await client.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    results.push(...(response.results as NotionPage[]));
    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  return results;
}

export async function fetchContainerCMS(): Promise<ContainerCMSData> {
  const containerId = process.env.NOTION_CONTAINER_CMS_PAGE_ID;
  if (!containerId) {
    console.warn("NOTION_CONTAINER_CMS_PAGE_ID is not defined.");
    return {
      pages: [],
      variables: {},
      groupCategories: {},
      componentRegistry: {},
      footer: [],
      redirects: [],
    };
  }

  let childDbs = await fetchPageChildDatabases(containerId);
  if (childDbs.length === 0) {
    const legacy = await fetchPageDatabases(containerId);
    childDbs = legacy.childDatabases.map((id) => ({ id, title: "" }));
  }

  const dbByTitle = Object.fromEntries(
    childDbs
      .filter((db) => db.title.trim())
      .map((db) => [db.title.trim().toLowerCase(), db.id]),
  );
  const pickDb = (title: string, fallbackIndex: number): string => {
    const byName = dbByTitle[title.trim().toLowerCase()];
    if (byName) return byName;
    return childDbs[fallbackIndex]?.id ?? "";
  };

  if (childDbs.length < 8) {
    console.warn(
      `NOTION_CONTAINER_CMS_PAGE_ID expects 8 child databases; found ${childDbs.length}.`,
    );
    return {
      pages: [],
      variables: {},
      groupCategories: {},
      componentRegistry: {},
      footer: [],
      redirects: [],
    };
  }

  const masterPageDbId = pickDb("Master Page", 0);
  const masterSectionsDbId = pickDb("Master Sections", 1);
  const masterComponentDbId = pickDb("Master Component", 2);
  const masterVariableDbId = pickDb("Master Variable", 3);
  const masterGroupDivCategoryDbId = pickDb("Master Group Div Category", 4);
  const masterRedirectDbId = pickDb("Master Redirect", 5);
  const footerDbId = pickDb("Footer", 6);
  const componentsDbId = pickDb("Components", 7);

  const [
    rawPages,
    rawSections,
    rawComponents,
    rawVariables,
    rawGroups,
    rawRedirects,
    rawFooter,
    rawRegistry,
  ] = await Promise.all([
    queryAll(masterPageDbId),
    queryAll(masterSectionsDbId),
    queryAll(masterComponentDbId),
    queryAll(masterVariableDbId),
    queryAll(masterGroupDivCategoryDbId),
    queryAll(masterRedirectDbId),
    queryAll(footerDbId),
    queryAll(componentsDbId),
  ]);

  // Variables
  const variables: Record<string, string> = {};
  for (const p of rawVariables) {
    variables[getTitle(p, "Variable")] = getRichText(p, "Value");
  }

  // Helper for applying variables
  const applyVariables = (text: string) => {
    if (!text) return text;
    let res = text;
    for (const [v, val] of Object.entries(variables)) {
      res = res.replaceAll(`$${v}$`, val);
      const asNumber = Number.parseInt(val, 10);
      if (!Number.isNaN(asNumber)) {
        res = res.replaceAll(`$${v}+1$`, String(asNumber + 1));
      }
    }
    return res;
  };

  // Group Categories
  const groupCategories: Record<string, CMSGroupCategory> = {};
  for (const p of rawGroups) {
    groupCategories[p.id] = {
      id: p.id,
      name: getTitle(p, "Name"),
      type: getSelect(p, "Type"),
    };
  }

  // Component Registry
  const componentRegistry: Record<string, CMSComponentRegistry> = {};
  for (const p of rawRegistry) {
    componentRegistry[p.id] = {
      id: p.id,
      type: getSelect(p, "Type"),
      name: getTitle(p, "Name"),
      variation1: getRichText(p, "Variation 1"),
      variation2: getRichText(p, "Variation 2"),
      variation3: getRichText(p, "Variation 3"),
      value1: getRichText(p, "Value 1"),
      value2: getRichText(p, "Value 2"),
      value3: getRichText(p, "Value 3"),
    };
  }

  // Footer
  const footer: CMSFooterComponent[] = rawFooter.map((p) => ({
    id: p.id,
    name: getTitle(p, "Name"),
    show: getCheckbox(p, "Show", true),
    group: getSelect(p, "Group"),
  }));

  // Redirects
  const redirects: CMSRedirect[] = rawRedirects.map((p) => ({
    id: p.id,
    name: getTitle(p, "Name"),
    modified: getRichText(p, "Modified"),
    destinationUrl:
      getUrl(p, "Destination URL") || getRichText(p, "Destination URL"),
  }));

  // Master Components
  const componentsList: CMSComponent[] = rawComponents.map((p) => ({
    id: p.id,
    typeId: getRelationIds(p, "Type")[0] || "",
    variation: getTitle(p, "Component Variation"),
    groupId: getRelationIds(p, "Master Group Div Category")[0] || "",
    show: getCheckbox(p, "Show", true),
    orderOrGroup: getRichText(p, "Order or Group"),
    value: applyVariables(getRichText(p, "Value")),
    value2: applyVariables(getRichText(p, "Value 2")),
    value3: applyVariables(getRichText(p, "Value 3")),
  }));

  // Link components to sections
  const sectionIdToComponents: Record<string, CMSComponent[]> = {};
  for (const c of componentsList) {
    const rawP = rawComponents.find((rc) => rc.id === c.id);
    if (!rawP) continue;
    const sectionIds = getRelationIds(rawP, "Section");
    if (sectionIds.length > 0) {
      const sectionId = sectionIds[0];
      if (!sectionIdToComponents[sectionId])
        sectionIdToComponents[sectionId] = [];
      sectionIdToComponents[sectionId].push(c);
    }
  }

  // Master Sections
  const sectionsList: CMSSection[] = rawSections.map((p) => {
    const sectionComps = sectionIdToComponents[p.id] || [];
    sectionComps.sort((a, b) => a.orderOrGroup.localeCompare(b.orderOrGroup));
    return {
      id: p.id,
      pageId: getRelationIds(p, "Page")[0] || "",
      sectionName: getTitle(p, "Section"),
      slug: getRichText(p, "Slug"),
      order: getRichText(p, "Order"),
      show: getCheckbox(p, "Show", true),
      height: getSelect(p, "Height"),
      components: sectionComps,
    };
  });

  // Link sections to pages
  const pageIdToSections: Record<string, CMSSection[]> = {};
  for (const s of sectionsList) {
    if (!pageIdToSections[s.pageId]) pageIdToSections[s.pageId] = [];
    pageIdToSections[s.pageId].push(s);
  }

  // Pages
  const pages: CMSPage[] = rawPages.map((p) => {
    const pSections = pageIdToSections[p.id] || [];
    pSections.sort((a, b) => a.order.localeCompare(b.order));
    return {
      id: p.id,
      name: getTitle(p, "Name"),
      slug: getRichText(p, "Slug"),
      type: getSelect(p, "Tipe"),
      showInNav:
        getCheckbox(p, "Show In Nav", true) &&
        getCheckbox(p, "Tampilkan Di Navbar", true),
      urutan: getRichText(p, "Urutan"),
      showFooter: getCheckbox(p, "Show Footer", true),
      sections: pSections,
      maxWidth: getRichText(p, "Max Width") || "7xl",
    };
  });

  return {
    pages,
    variables,
    groupCategories,
    componentRegistry,
    footer,
    redirects,
  };
}

export function normalizeCmsSlug(slug: string): string {
  const trimmed = slug.trim();
  if (trimmed === "/") return "/";
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Resolve a CMS page from the request path (exact match, then longest prefix). */
export function findCmsPageForPath(
  pages: CMSPage[],
  path: string,
): CMSPage | undefined {
  const target = normalizeCmsSlug(path) || "/";
  const contentPages = pages.filter((p) => p.type !== "Redirect");

  if (target === "/") {
    return (
      contentPages.find((p) => p.name.trim().toLowerCase() === "beranda") ||
      contentPages.find((p) => normalizeCmsSlug(p.slug || "") === "/")
    );
  }

  const exact = contentPages.find(
    (p) => normalizeCmsSlug(p.slug || "") === target,
  );
  if (exact) return exact;

  const prefixMatches = contentPages
    .filter((p) => {
      const slug = normalizeCmsSlug(p.slug || "");
      if (!slug || slug === "/") return false;
      return target === slug || target.startsWith(`${slug}/`);
    })
    .sort(
      (a, b) =>
        normalizeCmsSlug(b.slug || "").length -
        normalizeCmsSlug(a.slug || "").length,
    );

  return prefixMatches[0];
}

export const fetchContainerCMSCached = unstable_cache(
  async () => {
    return fetchContainerCMS();
  },
  ["notion-container-cms"],
  { revalidate: 60, tags: ["notion-container"] },
);

/**
 * Get the Master Page database ID from Container CMS
 */
async function getMasterPageDatabaseId(): Promise<string> {
  const containerId = process.env.NOTION_CONTAINER_CMS_PAGE_ID;
  if (!containerId) return "";

  let childDbs = await fetchPageChildDatabases(containerId);
  if (childDbs.length === 0) {
    const legacy = await fetchPageDatabases(containerId);
    childDbs = legacy.childDatabases.map((id) => ({ id, title: "" }));
  }

  const dbByTitle = Object.fromEntries(
    childDbs
      .filter((db) => db.title.trim())
      .map((db) => [db.title.trim().toLowerCase(), db.id]),
  );

  return dbByTitle["master page"] || childDbs[0]?.id || "";
}

/**
 * Resolve a page from Master Page database by name
 */
export async function resolvePageIdFromMasterPage(
  pageName: string,
): Promise<string> {
  const masterPageDbId = await getMasterPageDatabaseId();
  if (!masterPageDbId) return "";

  const pages = await queryAll(masterPageDbId);
  const page = pages.find(
    (p) => getTitle(p, "Name").toLowerCase() === pageName.toLowerCase(),
  );

  return page?.id || "";
}

/**
 * Get FAQ page ID by querying Master Page database
 */
export async function resolveFAQPageId(): Promise<string> {
  return resolvePageIdFromMasterPage("FAQ");
}

/**
 * Get Karya page ID by querying Master Page database
 */
export async function resolveKaryaPageId(): Promise<string> {
  return resolvePageIdFromMasterPage("Karya");
}

/**
 * Cached version of resolveFAQPageId
 */
export const resolveFAQPageIdCached = unstable_cache(
  async () => resolveFAQPageId(),
  ["notion-faq-page-id"],
  { revalidate: 3600, tags: ["notion-faq"] },
);

/**
 * Cached version of resolveKaryaPageId
 */
export const resolveKaryaPageIdCached = unstable_cache(
  async () => resolveKaryaPageId(),
  ["notion-karya-page-id"],
  { revalidate: 3600, tags: ["notion-karya"] },
);

export type CmsValueField = "value" | "value2" | "value3";

function registryFieldToCmsValue(
  registry: CMSComponentRegistry,
  field: CmsValueField,
): string {
  if (field === "value") return registry.value1;
  if (field === "value2") return registry.value2;
  return registry.value3;
}

/** Map Components DB Value 1/2/3 labels to instance fields via registry metadata. */
export function resolveCmsComponentFieldValue(
  cms: ContainerCMSData,
  componentName: string,
  fieldLabel: string,
): string | null {
  for (const page of cms.pages) {
    for (const section of page.sections) {
      for (const comp of section.components) {
        const registry = cms.componentRegistry[comp.typeId];
        if (!registry || registry.name !== componentName) continue;

        const v1Label = registry.value1.trim().toLowerCase();
        const v2Label = registry.value2.trim().toLowerCase();
        const v3Label = registry.value3.trim().toLowerCase();
        const target = fieldLabel.trim().toLowerCase();

        if (v1Label === target) return comp.value?.trim() || null;
        if (v2Label === target) return comp.value2?.trim() || null;
        if (v3Label === target) return comp.value3?.trim() || null;
      }
    }
  }
  return null;
}

export function findCmsComponentInstances(
  cms: ContainerCMSData,
  componentName: string,
): CMSComponent[] {
  const matches: CMSComponent[] = [];
  for (const page of cms.pages) {
    for (const section of page.sections) {
      for (const comp of section.components) {
        const registry = cms.componentRegistry[comp.typeId];
        if (registry?.name === componentName) {
          matches.push(comp);
        }
      }
    }
  }
  return matches;
}

/** Database ID from Master Component (default: Value 2 / "Database ID"). */
export function resolveCmsComponentDatabaseId(
  cms: ContainerCMSData,
  componentName: string,
  field: CmsValueField = "value2",
): string | null {
  const instances = findCmsComponentInstances(cms, componentName);
  if (!instances.length) return null;

  const registry = cms.componentRegistry[instances[0].typeId];
  const comp = instances[0];

  if (registry) {
    const byLabel = resolveCmsComponentFieldValue(
      cms,
      componentName,
      registryFieldToCmsValue(registry, field),
    );
    if (byLabel) return byLabel;
  }

  const raw =
    field === "value"
      ? comp.value
      : field === "value2"
        ? comp.value2
        : comp.value3;
  return raw?.trim() || null;
}

export async function resolveProfilSdmDatabaseIdFromCms(): Promise<
  string | null
> {
  const cms = await fetchContainerCMSCached();
  return resolveCmsComponentDatabaseId(
    cms,
    "Struktur Organisasi Graph",
    "value2",
  );
}

export async function resolveKaryaDatabaseIdFromCms(): Promise<string | null> {
  const cms = await fetchContainerCMSCached();
  return resolveCmsComponentDatabaseId(cms, "Karya Grid", "value");
}

export function resolveProfilMaxBatchFromCms(cms: ContainerCMSData): number {
  const batchRaw =
    resolveCmsComponentFieldValue(
      cms,
      "Struktur Organisasi Graph",
      "Tampilkan Batch dari 1 Sampai",
    ) ??
    findCmsComponentInstances(cms, "Struktur Organisasi Graph")[0]?.value ??
    "";

  const parsed = Number.parseInt(batchRaw, 10);
  return Number.isNaN(parsed) ? 999 : parsed;
}

export const createMockPage = (
  slug: string,
  componentTypeId: string,
): CMSPage => ({
  id: `mock-page-${componentTypeId}`,
  name: componentTypeId,
  slug,
  type: "Page",
  showInNav: false,
  urutan: "",
  showFooter: false,
  sections: [
    {
      id: `mock-section-${componentTypeId}`,
      pageId: `mock-page-${componentTypeId}`,
      sectionName: "Main",
      slug: "",
      order: "0",
      height: "Fit Content",
      show: true,
      components: [
        {
          id: `mock-comp-${componentTypeId}`,
          typeId: componentTypeId,
          groupId: "",
          orderOrGroup: "0",
          show: true,
          variation: "",
          value: "",
          value2: "",
          value3: "",
        },
      ],
    },
  ],
});

export interface NavItemDto {
  label: string;
  href?: string;
  isAnchor?: boolean;
}

export function getNavigationData(pages: CMSPage[]): {
  navItems: NavItemDto[];
  mobileNavItems: NavItemDto[];
  highlightItem: NavItemDto | null;
} {
  const getUrutanValue = (u: string) => {
    const val = Number.parseInt(u, 10);
    return Number.isNaN(val) ? 99999 : val;
  };

  // 1. Regular items
  const standardPages = pages
    .filter(
      (p) =>
        p.showInNav &&
        p.urutan?.toLowerCase() !== "logo" &&
        p.urutan?.toLowerCase() !== "highlight" &&
        p.urutan?.toLowerCase() !== "hidden",
    )
    .sort((a, b) => getUrutanValue(a.urutan) - getUrutanValue(b.urutan));

  const navItems: NavItemDto[] = standardPages.map((p) => {
    const isAnchor = p.name.toLowerCase() === "kontak";
    return {
      label: p.name,
      href: isAnchor ? undefined : p.slug,
      isAnchor,
    };
  });

  // 2. Highlight item
  const highlightPage = pages.find(
    (p) => p.urutan?.toLowerCase() === "highlight" && p.showInNav,
  );
  const highlightItem: NavItemDto | null = highlightPage
    ? { label: highlightPage.name, href: highlightPage.slug }
    : null;

  // 3. Logo/Beranda
  const logoPage = pages.find((p) => p.urutan?.toLowerCase() === "logo");
  const logoHref = logoPage?.slug || "/";
  const logoLabel = logoPage?.name || "Beranda";

  // 4. Mobile nav items
  const mobileNavItems: NavItemDto[] = [];
  mobileNavItems.push({ label: logoLabel, href: logoHref });

  // Non-anchor standard items
  const regularNonAnchor = navItems.filter((item) => !item.isAnchor);
  mobileNavItems.push(...regularNonAnchor);

  // Add highlight before Kontak anchor
  if (highlightItem) {
    mobileNavItems.push(highlightItem);
  }

  // Anchor items (like Kontak) at the end
  const anchorItems = navItems.filter((item) => item.isAnchor);
  mobileNavItems.push(...anchorItems);

  return {
    navItems,
    mobileNavItems,
    highlightItem,
  };
}
