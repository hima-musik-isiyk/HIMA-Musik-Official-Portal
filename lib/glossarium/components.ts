/**
 * Notion CMS Glossarium — Component Definitions
 * ================================================
 * Maps component names, types, and group categories
 * used by the page builder system (C layer).
 *
 * Source: 01 Component Types, 01 Group Div Category,
 *         and components/builder/Registry.tsx
 */

// ──────────────────────────────────────────────────────────────
//  Component Names (keys in Registry.tsx → React components)
//  These are the names as they appear in the Notion
//  "01 Component Types" database rows.
// ──────────────────────────────────────────────────────────────

export const COMPONENT_NAMES = [
  "Title",
  "Beranda Title",
  "Line Title",
  "Description",
  "Copy",
  "Information Card",
  "Button",
  "Button Span",
  "Aduan Form",
  "Struktur Organisasi Graph",
  "Karya Grid",
  "Timeline Seleksi",
  "FAQ List",
  "Agenda List",
  "Sekretariat Grid",
  "Sekretariat Sidebar",
  "Panduan Divisi",
  "Checklists",
  "KKM Grid",
  "Beranda Temp Artwork",
  "Doc Page",
  "Event Detail",
  "Pendaftaran Form",
  "The Wall",
] as const;

export type ComponentName = (typeof COMPONENT_NAMES)[number];

// ──────────────────────────────────────────────────────────────
//  Component Types (select options in 01 Component Types DB)
// ──────────────────────────────────────────────────────────────

export const COMPONENT_TYPES = [
  "Button",
  "Text",
  "Image",
  "Form",
  "Extra",
  "List",
  "Graph",
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];

// ──────────────────────────────────────────────────────────────
//  Group Div Category types & names
//  Used by SectionBuilder and ComponentBuilder for layout
// ──────────────────────────────────────────────────────────────

export const GROUP_DIV_TYPES = ["Position", "Flex", "Size"] as const;
export type GroupDivType = (typeof GROUP_DIV_TYPES)[number];

/** Known Group Div Category names and their layout semantics */
export const GROUP_DIV = {
  // Flex layouts
  VERTICALLY_ALIGN_CENTER: "Vertically Align Center",
  HORIZONTALLY_ALIGN_CENTER: "Horizontally Align Center",
  SPACE_BETWEEN: "Space Between",
  VERTICALLY_ALIGN_BOTTOM: "Vertically Align Bottom",
  VERTICALLY_ALIGN_TOP: "Vertically Align Top",
  HORIZONTALLY_ALIGN_LEFT: "Horizontally Align Left",
  HORIZONTALLY_ALIGN_RIGHT: "Horizontally Align Right",
  // Position layouts
  BACKGROUND: "Background",
  IGNORE_SECTION_PADDINGS: "Ignore Section Paddings",
  SPAN_ALL_HEIGHT: "Span All Height",
} as const;

export type GroupDivName = (typeof GROUP_DIV)[keyof typeof GROUP_DIV];

// ──────────────────────────────────────────────────────────────
//  Section Height options
// ──────────────────────────────────────────────────────────────

export const SECTION_HEIGHTS = ["Full Viewport", "Fit Content"] as const;
export type SectionHeightOption = (typeof SECTION_HEIGHTS)[number];

// ──────────────────────────────────────────────────────────────
//  Footer Group options
// ──────────────────────────────────────────────────────────────

export const FOOTER_GROUPS = ["2 Grid", "1 Whole"] as const;
export type FooterGroupOption = (typeof FOOTER_GROUPS)[number];

// ──────────────────────────────────────────────────────────────
//  Page Type options
// ──────────────────────────────────────────────────────────────

export const PAGE_TYPES = ["Page", "Redirect"] as const;
export type PageTypeOption = (typeof PAGE_TYPES)[number];
