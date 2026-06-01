import type { CMSPage, CMSSection, ContainerCMSData } from "./notion-builder";

function normalizePagePath(slug: string): string {
  const trimmed = slug.trim();
  if (trimmed === "/") return "/";
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function normalizeSectionHash(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

type SectionWithPage = CMSSection & { pageSlug: string };

function flattenSections(pages: CMSPage[]): SectionWithPage[] {
  return pages.flatMap((page) => {
    const pageSlug = normalizePagePath(page.slug || "");
    return page.sections.map((section) => ({ ...section, pageSlug }));
  });
}

function matchKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeNotionId(id: string): string {
  const compact = id.replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(compact)) return id.trim();
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

/**
 * Resolve Master Component Value 3 to a navigable href.
 * Value 3 may be a Master Page name/slug, Master Section name/slug,
 * or an already-resolved path (#anchor, /path, URL).
 */
export function resolveCmsHref(
  value3: string,
  cmsData: ContainerCMSData,
  contextPageId?: string,
): string {
  const raw = value3?.trim() ?? "";
  if (!raw) return "";

  if (
    raw.startsWith("/") ||
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("mailto:")
  ) {
    return raw;
  }

  if (raw.startsWith("#")) {
    if (contextPageId) {
      const page = cmsData.pages.find((p) => p.id === contextPageId);
      if (page) {
        return `${normalizePagePath(page.slug || "/")}${normalizeSectionHash(raw)}`;
      }
    }
    return normalizeSectionHash(raw);
  }

  const key = matchKey(raw);
  const contentPages = cmsData.pages.filter((p) => p.type !== "Redirect");

  const normalizedId = normalizeNotionId(raw);

  const pageMatch = contentPages.find((p) => {
    const pageSlug = normalizePagePath(p.slug || "");
    return (
      p.id === normalizedId ||
      matchKey(p.name) === key ||
      matchKey(pageSlug) === key ||
      matchKey(pageSlug.replace(/^\//, "")) === key
    );
  });

  if (pageMatch) {
    return normalizePagePath(pageMatch.slug || "/");
  }

  const allSections = flattenSections(contentPages);
  const contextSections = contextPageId
    ? allSections.filter((s) => s.pageId === contextPageId)
    : [];
  const pool = [...contextSections, ...allSections];

  const sectionMatch = pool.find((s) => {
    const hash = normalizeSectionHash(s.slug || "");
    return (
      s.id === normalizedId ||
      matchKey(s.sectionName) === key ||
      matchKey(hash) === key ||
      matchKey(hash.replace(/^#/, "")) === key
    );
  });

  if (sectionMatch && sectionMatch.pageSlug) {
    return `${sectionMatch.pageSlug}${normalizeSectionHash(sectionMatch.slug || "")}`;
  }

  return "";
}
