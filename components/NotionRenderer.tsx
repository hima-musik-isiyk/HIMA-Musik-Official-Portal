"use client";

import React from "react";

import type { NotionBlock } from "@/lib/notion";

/* ------------------------------------------------------------------ */
/*  Rich-text rendering                                                */
/* ------------------------------------------------------------------ */

interface RichTextItem {
  type: "text" | "mention" | "equation";
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}

const TEXT_COLOR_MAP: Record<string, string> = {
  red: "text-red-400",
  blue: "text-blue-400",
  green: "text-green-400",
  yellow: "text-yellow-300",
  orange: "text-orange-400",
  purple: "text-purple-400",
  pink: "text-pink-400",
  brown: "text-amber-600",
  gray: "text-stone-400",
};

const BG_COLOR_MAP: Record<string, string> = {
  red_background: "bg-red-950/40 rounded px-0.5",
  blue_background: "bg-blue-950/40 rounded px-0.5",
  green_background: "bg-green-950/40 rounded px-0.5",
  yellow_background: "bg-yellow-950/40 rounded px-0.5",
  orange_background: "bg-orange-950/40 rounded px-0.5",
  purple_background: "bg-purple-950/40 rounded px-0.5",
  pink_background: "bg-pink-950/40 rounded px-0.5",
  brown_background: "bg-amber-950/40 rounded px-0.5",
  gray_background: "bg-stone-800/60 rounded px-0.5",
};

const CELL_BG_COLOR_MAP: Record<string, string> = {
  red_background: "bg-red-950/40",
  blue_background: "bg-blue-950/40",
  green_background: "bg-green-950/40",
  yellow_background: "bg-yellow-950/40",
  orange_background: "bg-orange-950/40",
  purple_background: "bg-purple-950/40",
  pink_background: "bg-pink-950/40",
  brown_background: "bg-amber-950/40",
  gray_background: "bg-stone-800/60",
};

const BLOCK_BG_COLOR_MAP: Record<string, string> = {
  red_background: "bg-red-950/30 border border-red-900/30",
  blue_background: "bg-blue-950/30 border border-blue-900/30",
  green_background: "bg-green-950/30 border border-green-900/30",
  yellow_background: "bg-yellow-950/30 border border-yellow-900/30",
  orange_background: "bg-orange-950/30 border border-orange-900/30",
  purple_background: "bg-purple-950/30 border border-purple-900/30",
  pink_background: "bg-pink-950/30 border border-pink-900/30",
  brown_background: "bg-amber-950/30 border border-amber-900/30",
  gray_background: "bg-stone-900/60 border border-stone-700/30",
};

function renderRichText(richText: RichTextItem[], ignoreColor = false) {
  return richText.map((item, i) => {
    let node: React.ReactNode = item.plain_text;

    if (item.annotations.bold) node = <strong>{node}</strong>;
    if (item.annotations.italic) node = <em>{node}</em>;
    if (item.annotations.strikethrough) node = <s>{node}</s>;
    if (item.annotations.underline)
      node = <span className="underline">{node}</span>;
    if (item.annotations.code)
      node = (
        <code className="text-gold-300 rounded bg-stone-800 px-1.5 py-0.5 font-mono text-sm">
          {node}
        </code>
      );

    const color = item.annotations.color;
    if (!ignoreColor && color !== "default") {
      if (BG_COLOR_MAP[color]) {
        node = <span className={BG_COLOR_MAP[color]}>{node}</span>;
      } else if (TEXT_COLOR_MAP[color]) {
        node = <span className={TEXT_COLOR_MAP[color]}>{node}</span>;
      }
    }

    if (item.href) {
      node = (
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="text-gold-400 decoration-gold-400/30 hover:text-gold-300 hover:decoration-gold-300/50 underline underline-offset-2 transition-colors"
        >
          {node}
        </a>
      );
    }

    return <React.Fragment key={i}>{node}</React.Fragment>;
  });
}

/* ------------------------------------------------------------------ */
/*  Extract text from any block for heading ID anchors                 */
/* ------------------------------------------------------------------ */

function extractPlainText(block: NotionBlock): string {
  const b = block as Record<string, unknown>;
  const typed = b[block.type] as { rich_text?: RichTextItem[] } | undefined;
  if (typed?.rich_text) {
    return typed.rich_text.map((t) => t.plain_text).join("");
  }
  return "";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/* ------------------------------------------------------------------ */
/*  YouTube / Vimeo URL → embed URL                                    */
/* ------------------------------------------------------------------ */

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);

    // YouTube
    const ytId =
      u.searchParams.get("v") ??
      (u.hostname === "youtu.be" ? u.pathname.slice(1) : null) ??
      (u.hostname.includes("youtube.com") && u.pathname.startsWith("/shorts/")
        ? u.pathname.replace("/shorts/", "")
        : null);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;

    // Vimeo
    const vmMatch = u.pathname.match(/\/(\d+)/);
    if (u.hostname.includes("vimeo.com") && vmMatch)
      return `https://player.vimeo.com/video/${vmMatch[1]}`;

    // Already an embed URL
    if (url.includes("/embed/") || url.includes("player.")) return url;
  } catch {
    // ignore
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Table helpers (module-scope to avoid switch-block hoisting issues) */
/* ------------------------------------------------------------------ */

/** Extract rich-text cell arrays from a table_row block. */
function getTableRowCells(block: NotionBlock): RichTextItem[][] {
  // Access via Record cast — same pattern used elsewhere for typed data.
  const tableRow = (block as Record<string, unknown>).table_row;
  if (!tableRow || typeof tableRow !== "object") return [];
  const cells = (tableRow as Record<string, unknown>).cells;
  if (!Array.isArray(cells)) return [];
  // Each element is an array of RichTextItemResponse from the Notion SDK.
  // The shape matches our RichTextItem interface exactly.
  return cells as RichTextItem[][];
}

function getCellColorClasses(cell: RichTextItem[]): {
  bg: string;
  text: string;
} {
  if (!Array.isArray(cell) || cell.length === 0) {
    return { bg: "", text: "" };
  }

  const color =
    cell.find(
      (item) => item.annotations?.color && item.annotations.color !== "default",
    )?.annotations?.color ?? "default";

  if (color === "default") return { bg: "", text: "" };

  // Background variant (e.g. "red_background")
  if (CELL_BG_COLOR_MAP[color]) {
    return { bg: CELL_BG_COLOR_MAP[color], text: "" };
  }

  // Text-color variant (e.g. "red") — apply as text color only
  if (TEXT_COLOR_MAP[color]) {
    return { bg: "", text: TEXT_COLOR_MAP[color] };
  }

  return { bg: "", text: "" };
}

/* ------------------------------------------------------------------ */
/*  Block-level renderer                                               */
/* ------------------------------------------------------------------ */

interface NotionRendererProps {
  blocks: NotionBlock[];
}

export default function NotionRenderer({ blocks }: NotionRendererProps) {
  return (
    <div className="notion-content space-y-4">
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: NotionBlock }) {
  const b = block as Record<string, unknown>;
  const typed = b[block.type] as
    | {
        rich_text?: RichTextItem[];
        caption?: RichTextItem[];
        url?: string;
        language?: string;
        checked?: boolean;
        type?: string;
        external?: { url: string };
        file?: { url: string; expiry_time?: string };
        expression?: string;
        color?: string;
        icon?: {
          emoji?: string;
          type?: string;
          external?: { url: string };
          file?: { url: string };
        };
        has_column_header?: boolean;
        has_row_header?: boolean;
        title?: string;
        name?: string;
        synced_from?: { type: string; block_id: string } | null;
        page_id?: string;
        database_id?: string;
      }
    | undefined;

  const blockColor = typed?.color;
  const blockBgClass =
    blockColor && BLOCK_BG_COLOR_MAP[blockColor]
      ? BLOCK_BG_COLOR_MAP[blockColor]
      : "";
  const blockTextClass =
    blockColor &&
    !blockColor.endsWith("_background") &&
    TEXT_COLOR_MAP[blockColor]
      ? TEXT_COLOR_MAP[blockColor]
      : "";

  switch (block.type) {
    /* ---- Text blocks ---- */
    case "paragraph": {
      if (!typed?.rich_text?.length) return <div className="h-4" />;
      const cls = [
        "text-base leading-relaxed",
        blockTextClass || "text-neutral-300",
        blockBgClass ? `${blockBgClass} px-3 py-2 rounded-lg` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return <p className={cls}>{renderRichText(typed.rich_text)}</p>;
    }

    case "heading_1": {
      const text = extractPlainText(block);
      const id = slugify(text);
      return (
        <h1
          id={id}
          className="scroll-mt-24 border-b border-stone-800 pb-4 font-serif text-3xl font-bold text-white md:text-4xl"
        >
          {typed?.rich_text && renderRichText(typed.rich_text)}
        </h1>
      );
    }

    case "heading_2": {
      const text = extractPlainText(block);
      const id = slugify(text);
      return (
        <h2
          id={id}
          className="scroll-mt-24 font-serif text-2xl font-bold text-white md:text-3xl"
        >
          {typed?.rich_text && renderRichText(typed.rich_text)}
        </h2>
      );
    }

    case "heading_3": {
      const text = extractPlainText(block);
      const id = slugify(text);
      return (
        <h3
          id={id}
          className="scroll-mt-24 font-serif text-xl font-semibold text-white"
        >
          {typed?.rich_text && renderRichText(typed.rich_text)}
        </h3>
      );
    }

    /* ---- List blocks ---- */
    case "bulleted_list_item":
      return (
        <li
          className={`ml-6 list-disc ${blockTextClass || "text-neutral-300"}`}
        >
          {typed?.rich_text && renderRichText(typed.rich_text)}
          {block.children && block.children.length > 0 && (
            <ul className="mt-1 space-y-1">
              {block.children.map((child) => (
                <BlockRenderer key={child.id} block={child} />
              ))}
            </ul>
          )}
        </li>
      );

    case "numbered_list_item":
      return (
        <li
          className={`ml-6 list-decimal ${blockTextClass || "text-neutral-300"}`}
        >
          {typed?.rich_text && renderRichText(typed.rich_text)}
          {block.children && block.children.length > 0 && (
            <ol className="mt-1 space-y-1">
              {block.children.map((child) => (
                <BlockRenderer key={child.id} block={child} />
              ))}
            </ol>
          )}
        </li>
      );

    case "to_do":
      return (
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 h-4 w-4 shrink-0 rounded border ${
              typed?.checked
                ? "border-gold-500 bg-gold-500"
                : "border-stone-600"
            }`}
          >
            {typed?.checked && (
              <svg viewBox="0 0 16 16" className="h-4 w-4 text-black">
                <path
                  d="M6.5 12L2 7.5l1.5-1.5L6.5 9 12.5 3 14 4.5z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>
          <span
            className={
              typed?.checked
                ? "text-stone-500 line-through"
                : "text-neutral-300"
            }
          >
            {typed?.rich_text && renderRichText(typed.rich_text)}
          </span>
        </div>
      );

    /* ---- Container blocks ---- */
    case "toggle": {
      return (
        <details className="group rounded-lg border border-stone-800 bg-stone-900/30 px-4 py-3">
          <summary className="cursor-pointer font-medium text-white">
            {typed?.rich_text && renderRichText(typed.rich_text)}
          </summary>
          <div className="mt-3 border-t border-stone-800 pt-3 text-neutral-300">
            {block.children && <NotionRenderer blocks={block.children} />}
          </div>
        </details>
      );
    }

    case "column_list": {
      const columns = block.children ?? [];
      const colCount = Math.max(2, Math.min(columns.length, 6));
      const colClass: Record<number, string> = {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
      };
      return (
        <div
          className={`grid gap-6 ${colClass[colCount] ?? "grid-cols-2"} max-sm:grid-cols-1`}
        >
          {columns.map((col) => (
            <BlockRenderer key={col.id} block={col} />
          ))}
        </div>
      );
    }

    case "column": {
      return (
        <div className="min-w-0 space-y-4">
          {block.children?.map((child) => (
            <BlockRenderer key={child.id} block={child} />
          ))}
        </div>
      );
    }

    case "synced_block": {
      return (
        <>
          {block.children?.map((child) => (
            <BlockRenderer key={child.id} block={child} />
          ))}
        </>
      );
    }

    /* ---- Quote / Callout / Divider ---- */
    case "quote":
      return (
        <blockquote
          className={`border-gold-500 border-l-4 py-3 pr-4 pl-6 italic ${
            blockBgClass ? `${blockBgClass} rounded-r-lg` : "bg-gold-500/5"
          } ${blockTextClass || "text-neutral-300"}`}
        >
          {typed?.rich_text && renderRichText(typed.rich_text)}
          {block.children && (
            <div className="mt-2">
              <NotionRenderer blocks={block.children} />
            </div>
          )}
        </blockquote>
      );

    case "callout": {
      const iconData = (
        b[block.type] as {
          icon?: { emoji?: string; type?: string; external?: { url: string } };
        }
      )?.icon;
      const iconNode = iconData?.emoji ? (
        <span className="shrink-0 text-xl">{iconData.emoji}</span>
      ) : iconData?.type === "external" && iconData.external?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconData.external.url} alt="" className="h-5 w-5 shrink-0" />
      ) : null;

      const bgCls = blockBgClass
        ? `${blockBgClass} rounded-lg p-4`
        : "rounded-lg border border-stone-800 bg-stone-900/50 p-4";

      return (
        <div className={`flex gap-3 ${bgCls}`}>
          {iconNode}
          <div className={`min-w-0 ${blockTextClass || "text-neutral-300"}`}>
            {typed?.rich_text && renderRichText(typed.rich_text)}
            {block.children && (
              <div className="mt-2">
                <NotionRenderer blocks={block.children} />
              </div>
            )}
          </div>
        </div>
      );
    }

    case "divider":
      return <hr className="border-stone-800" />;

    /* ---- Code ---- */
    case "code": {
      const caption = typed?.caption;
      return (
        <div className="overflow-hidden rounded-lg border border-stone-800">
          {typed?.language && (
            <div className="border-b border-stone-800 bg-stone-900/80 px-4 py-2 text-xs tracking-wider text-stone-500 uppercase">
              {typed.language}
            </div>
          )}
          <pre className="overflow-x-auto bg-stone-900/50 p-4">
            <code className="font-mono text-sm text-neutral-300">
              {typed?.rich_text?.map((t) => t.plain_text).join("") ?? ""}
            </code>
          </pre>
          {caption && caption.length > 0 && (
            <div className="border-t border-stone-800 bg-stone-900/30 px-4 py-2 text-xs text-stone-500">
              {renderRichText(caption)}
            </div>
          )}
        </div>
      );
    }

    /* ---- Media ---- */
    case "image": {
      const url =
        typed?.type === "external" ? typed.external?.url : typed?.file?.url;
      const caption = typed?.caption;
      return (
        <figure className="my-6">
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={caption?.map((c) => c.plain_text).join("") || ""}
              className="w-full rounded-lg border border-stone-800"
              loading="lazy"
            />
          )}
          {caption && caption.length > 0 && (
            <figcaption className="mt-2 text-center text-sm text-stone-500">
              {renderRichText(caption)}
            </figcaption>
          )}
        </figure>
      );
    }

    case "video": {
      const url =
        typed?.type === "external" ? typed.external?.url : typed?.file?.url;
      const caption = typed?.caption;
      if (!url) return null;

      const embedUrl = toEmbedUrl(url);
      return (
        <figure className="my-6">
          {embedUrl ? (
            <div className="overflow-hidden rounded-lg border border-stone-800">
              <div className="relative aspect-video">
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={caption?.map((c) => c.plain_text).join("") || "Video"}
                />
              </div>
            </div>
          ) : (
            <video
              src={url}
              controls
              className="w-full rounded-lg border border-stone-800"
            />
          )}
          {caption && caption.length > 0 && (
            <figcaption className="mt-2 text-center text-sm text-stone-500">
              {renderRichText(caption)}
            </figcaption>
          )}
        </figure>
      );
    }

    case "audio": {
      const url =
        typed?.type === "external" ? typed.external?.url : typed?.file?.url;
      const caption = typed?.caption;
      if (!url) return null;
      return (
        <figure className="my-4">
          <audio src={url} controls className="w-full rounded-lg" />
          {caption && caption.length > 0 && (
            <figcaption className="mt-2 text-center text-sm text-stone-500">
              {renderRichText(caption)}
            </figcaption>
          )}
        </figure>
      );
    }

    case "file": {
      const url =
        typed?.type === "external" ? typed.external?.url : typed?.file?.url;
      const nameArr = typed?.caption;
      const displayName =
        nameArr && nameArr.length > 0
          ? nameArr.map((t) => t.plain_text).join("")
          : (url?.split("/").pop()?.split("?")[0] ?? "Download file");
      return (
        <a
          href={url ?? "#"}
          target="_blank"
          rel="noreferrer"
          download
          className="flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-900/40 px-4 py-3 text-sm text-neutral-300 transition-colors hover:bg-stone-900/70"
        >
          <svg
            className="h-5 w-5 shrink-0 text-stone-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>{displayName}</span>
        </a>
      );
    }

    case "pdf": {
      const url =
        typed?.type === "external" ? typed.external?.url : typed?.file?.url;
      const caption = typed?.caption;
      if (!url) return null;
      return (
        <figure className="my-6">
          <div className="overflow-hidden rounded-lg border border-stone-800">
            <iframe
              src={url}
              className="h-[600px] w-full bg-stone-900"
              title={caption?.map((c) => c.plain_text).join("") || "PDF"}
            />
          </div>
          {caption && caption.length > 0 && (
            <figcaption className="mt-2 text-center text-sm text-stone-500">
              {renderRichText(caption)}
            </figcaption>
          )}
        </figure>
      );
    }

    case "embed": {
      const url = typed?.url ?? "";
      if (!url) return null;
      const embedUrl = toEmbedUrl(url) ?? url;
      return (
        <div className="overflow-hidden rounded-lg border border-stone-800">
          <div className="relative aspect-video">
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full bg-stone-900"
              allowFullScreen
              title="Embedded content"
            />
          </div>
        </div>
      );
    }

    /* ---- Table ---- */
    case "table": {
      const tableData = (block as Record<string, unknown>).table as
        | { has_column_header?: boolean; has_row_header?: boolean }
        | undefined;
      const hasColHeader = tableData?.has_column_header ?? false;
      const hasRowHeader = tableData?.has_row_header ?? false;
      const rows = block.children ?? [];

      const bodyRows = hasColHeader ? rows.slice(1) : rows;

      return (
        <div className="overflow-x-auto rounded-lg border border-stone-700">
          <table className="min-w-full border-collapse">
            {hasColHeader && rows.length > 0 && (
              <thead>
                <tr className="border-b border-stone-700 bg-stone-800/80">
                  {getTableRowCells(rows[0]).map((cell, cellIdx) => {
                    const { bg, text } = getCellColorClasses(cell);
                    return (
                      <th
                        key={cellIdx}
                        scope="col"
                        className={[
                          "px-4 py-3 text-left text-sm font-semibold",
                          bg || "bg-stone-800/80",
                          text || "text-white",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {renderRichText(cell, true)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-stone-800">
              {bodyRows.map((row, rowIdx) => {
                const cells = getTableRowCells(row);
                return (
                  <tr
                    key={row.id}
                    className={
                      rowIdx % 2 === 0 ? "bg-stone-900/40" : "bg-stone-950/60"
                    }
                  >
                    {cells.map((cell, cellIdx) => {
                      const { bg, text } = getCellColorClasses(cell);
                      if (hasRowHeader && cellIdx === 0) {
                        return (
                          <th
                            key={cellIdx}
                            scope="row"
                            className={[
                              "px-4 py-3 text-left text-sm font-semibold whitespace-nowrap",
                              bg,
                              text || "text-white",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {renderRichText(cell, true)}
                          </th>
                        );
                      }
                      return (
                        <td
                          key={cellIdx}
                          className={[
                            "px-4 py-3 text-sm",
                            bg,
                            text || "text-neutral-200",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {renderRichText(cell, true)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    case "table_row":
      return null;

    /* ---- Link / Bookmark blocks ---- */
    case "bookmark":
    case "link_preview": {
      const url = typed?.url ?? "";
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-gold-400 hover:border-gold-500/30 block rounded-lg border border-stone-800 bg-stone-900/30 p-4 text-sm transition-colors hover:bg-stone-900/50"
        >
          {url}
        </a>
      );
    }

    case "link_to_page": {
      const ltp = b[block.type] as
        | { type: "page_id"; page_id: string }
        | { type: "database_id"; database_id: string }
        | undefined;
      if (!ltp) return null;
      const href =
        ltp.type === "page_id"
          ? `/docs/${ltp.page_id}`
          : `/docs?db=${ltp.database_id}`;
      return (
        <a
          href={href}
          className="text-gold-400 hover:text-gold-300 flex items-center gap-2 text-sm transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Lihat halaman terkait</span>
        </a>
      );
    }

    case "child_page": {
      const childPage = b[block.type] as { title?: string } | undefined;
      return (
        <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/30 px-4 py-3 text-sm text-neutral-300">
          <svg
            className="h-4 w-4 shrink-0 text-stone-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>{childPage?.title ?? "Sub-halaman"}</span>
        </div>
      );
    }

    case "child_database": {
      const childDb = b[block.type] as { title?: string } | undefined;
      return (
        <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/30 px-4 py-3 text-sm text-neutral-300">
          <svg
            className="h-4 w-4 shrink-0 text-stone-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
          <span>{childDb?.title ?? "Database"}</span>
        </div>
      );
    }

    /* ---- Table of contents ---- */
    case "table_of_contents":
      return null;

    /* ---- Equation ---- */
    case "equation":
      return (
        <div className="my-4 rounded-lg bg-stone-900/50 p-4 font-mono text-neutral-300">
          {typed?.expression}
        </div>
      );

    /* ---- Unsupported ---- */
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Heading extraction for ToC                                         */
/* ------------------------------------------------------------------ */

export interface TocItem {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export function extractHeadings(blocks: NotionBlock[]): TocItem[] {
  const headings: TocItem[] = [];

  for (const block of blocks) {
    if (
      block.type === "heading_1" ||
      block.type === "heading_2" ||
      block.type === "heading_3"
    ) {
      const text = extractPlainText(block);
      if (text) {
        headings.push({
          id: slugify(text),
          text,
          level:
            block.type === "heading_1" ? 1 : block.type === "heading_2" ? 2 : 3,
        });
      }
    }

    // Recurse into columns
    if (block.type === "column_list" && block.children) {
      for (const col of block.children) {
        if (col.children) {
          headings.push(...extractHeadings(col.children));
        }
      }
    }
  }

  return headings;
}
