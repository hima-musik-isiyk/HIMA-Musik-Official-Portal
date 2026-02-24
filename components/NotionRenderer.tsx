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

function renderRichText(richText: RichTextItem[]) {
  return richText.map((item, i) => {
    let node: React.ReactNode = item.plain_text;

    if (item.annotations.bold) node = <strong key={i}>{node}</strong>;
    if (item.annotations.italic) node = <em key={i}>{node}</em>;
    if (item.annotations.strikethrough) node = <s key={i}>{node}</s>;
    if (item.annotations.underline)
      node = (
        <span key={i} className="underline">
          {node}
        </span>
      );
    if (item.annotations.code)
      node = (
        <code
          key={i}
          className="text-gold-300 rounded bg-stone-800 px-1.5 py-0.5 font-mono text-sm"
        >
          {node}
        </code>
      );
    if (item.annotations.color !== "default") {
      const colorMap: Record<string, string> = {
        red: "text-red-400",
        blue: "text-blue-400",
        green: "text-green-400",
        yellow: "text-yellow-400",
        orange: "text-orange-400",
        purple: "text-purple-400",
        pink: "text-pink-400",
        brown: "text-amber-600",
        gray: "text-stone-400",
      };
      const cls = colorMap[item.annotations.color] ?? "";
      if (cls) node = <span className={cls}>{node}</span>;
    }
    if (item.href) {
      node = (
        <a
          key={i}
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
        children?: NotionBlock[];
        type?: string;
        external?: { url: string };
        file?: { url: string };
        expression?: string;
      }
    | undefined;

  switch (block.type) {
    case "paragraph": {
      if (!typed?.rich_text?.length) return <div className="h-4" />;
      return (
        <p className="text-base leading-relaxed text-neutral-300">
          {renderRichText(typed.rich_text)}
        </p>
      );
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

    case "bulleted_list_item":
      return (
        <li className="ml-6 list-disc text-neutral-300">
          {typed?.rich_text && renderRichText(typed.rich_text)}
        </li>
      );

    case "numbered_list_item":
      return (
        <li className="ml-6 list-decimal text-neutral-300">
          {typed?.rich_text && renderRichText(typed.rich_text)}
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

    case "toggle": {
      return (
        <details className="group rounded-lg border border-stone-800 bg-stone-900/30 px-4 py-3">
          <summary className="cursor-pointer font-medium text-white">
            {typed?.rich_text && renderRichText(typed.rich_text)}
          </summary>
          <div className="mt-3 border-t border-stone-800 pt-3 text-neutral-300">
            {typed?.children && (
              <NotionRenderer blocks={typed.children as NotionBlock[]} />
            )}
          </div>
        </details>
      );
    }

    case "quote":
      return (
        <blockquote className="border-gold-500 bg-gold-500/5 border-l-4 py-3 pr-4 pl-6 text-neutral-300 italic">
          {typed?.rich_text && renderRichText(typed.rich_text)}
        </blockquote>
      );

    case "callout": {
      const icon = (b[block.type] as { icon?: { emoji?: string } })?.icon
        ?.emoji;
      return (
        <div className="flex gap-3 rounded-lg border border-stone-800 bg-stone-900/50 p-4">
          {icon && <span className="text-xl">{icon}</span>}
          <div className="text-neutral-300">
            {typed?.rich_text && renderRichText(typed.rich_text)}
          </div>
        </div>
      );
    }

    case "code":
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
        </div>
      );

    case "divider":
      return <hr className="border-stone-800" />;

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

    case "table": {
      const tableBlock = b[block.type] as {
        has_column_header: boolean;
        has_row_header: boolean;
        children?: NotionBlock[];
      };
      const rows = tableBlock?.children ?? [];
      return (
        <div className="overflow-x-auto rounded-lg border border-stone-800">
          <table className="min-w-full divide-y divide-stone-800">
            <tbody className="divide-y divide-stone-800">
              {rows.map((row, rowIdx) => {
                const cells = (
                  row as unknown as {
                    table_row: { cells: RichTextItem[][] };
                  }
                ).table_row?.cells;
                const isHeader = rowIdx === 0 && tableBlock.has_column_header;
                return (
                  <tr
                    key={row.id}
                    className={isHeader ? "bg-stone-900/80" : ""}
                  >
                    {cells?.map((cell, cellIdx) => {
                      const Tag = isHeader ? "th" : "td";
                      return (
                        <Tag
                          key={cellIdx}
                          className={`px-4 py-3 text-sm ${
                            isHeader
                              ? "font-semibold text-white"
                              : "text-neutral-300"
                          }`}
                        >
                          {renderRichText(cell)}
                        </Tag>
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

    case "equation":
      return (
        <div className="my-4 rounded-lg bg-stone-900/50 p-4 font-mono text-neutral-300">
          {typed?.expression}
        </div>
      );

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
  }

  return headings;
}
