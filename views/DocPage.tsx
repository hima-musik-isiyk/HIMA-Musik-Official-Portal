"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import NotionRenderer, { extractHeadings } from "@/components/NotionRenderer";
import TableOfContents from "@/components/TableOfContents";
import type { DocMeta, NotionBlock } from "@/lib/notion-shared";
import useViewEntrance from "@/lib/useViewEntrance";

interface DocPageViewProps {
  meta: DocMeta;
  blocks: NotionBlock[];
}

export default function DocPageView({ meta, blocks }: DocPageViewProps) {
  const pathname = usePathname();
  const scopeRef = useViewEntrance(pathname || "");
  const headings = extractHeadings(blocks);

  const formattedDate = meta.lastEdited
    ? new Date(meta.lastEdited).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const isLegalitas = meta.category?.toLowerCase() === "legalitas";

  return (
    <div ref={scopeRef} className="flex gap-8 px-6 py-10 md:px-10 lg:px-16">
      {/* Center: Reading Pane */}
      <article
        className={`max-w-3xl min-w-0 flex-1 ${isLegalitas ? "mx-auto" : ""}`}
      >
        {/* Breadcrumb */}
        <nav
          className={`dp-breadcrumb mb-6 flex gap-2 text-xs text-stone-500 ${isLegalitas ? "justify-center" : "items-center"}`}
          data-animate="up"
        >
          <Link
            href="/sekretariat"
            className="transition-colors hover:text-stone-300"
          >
            Sekretariat
          </Link>
          {meta.category && (
            <>
              <span>/</span>
              <span className="text-stone-400">{meta.category}</span>
            </>
          )}
          <span>/</span>
          <span className="text-gold-400">{meta.title}</span>
        </nav>

        {/* Header */}
        <header
          className={`dp-header mb-10 ${isLegalitas ? "text-center" : ""}`}
          data-animate="up"
          data-animate-delay="0.1"
        >
          <h1 className="font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {meta.title}
          </h1>
          {formattedDate && (
            <p className="mt-3 text-sm text-stone-500">
              Terakhir diperbarui: {formattedDate}
            </p>
          )}
        </header>

        {/* Mobile inline ToC — only visible below xl */}
        {headings.length > 0 && (
          <details
            data-animate="up"
            data-animate-delay="0.2"
            className="mb-8 rounded-lg border border-stone-800 bg-stone-900/40 px-4 py-3 xl:hidden"
          >
            <summary className="cursor-pointer text-sm font-semibold tracking-widest text-stone-400 uppercase">
              Daftar Isi
            </summary>
            <nav className="mt-3 space-y-1 border-l border-stone-800 pt-1">
              {headings.map((h) => {
                const indent =
                  h.level === 1
                    ? "pl-3"
                    : h.level === 2
                      ? "pl-6"
                      : h.level === 3
                        ? "pl-9"
                        : h.level === 4
                          ? "pl-12"
                          : h.level === 5
                            ? "pl-14"
                            : "pl-16";
                return (
                  <a
                    key={h.blockId}
                    href={`#${h.id}`}
                    className={`block py-1 text-sm text-stone-400 transition-colors hover:text-stone-200 ${indent}`}
                  >
                    {h.text}
                  </a>
                );
              })}
            </nav>
          </details>
        )}

        {/* Content */}
        <div
          data-animate="up"
          data-animate-delay="0.2"
          className={`prose-docs ${isLegalitas ? "text-center" : ""}`}
        >
          <NotionRenderer blocks={blocks} />
        </div>

        {/* Bottom nav */}
        <div
          data-animate="up"
          data-animate-delay="0.3"
          className="mt-16 border-t border-stone-800 pt-8"
        >
          <Link
            href="/sekretariat"
            className="text-gold-400 hover:text-gold-300 text-sm transition-colors"
          >
            ← Kembali ke Sekretariat
          </Link>
        </div>
      </article>

      {/* Right: Table of Contents — hidden below xl breakpoint */}
      <div
        data-animate="left"
        data-animate-delay="0.3"
        className="hidden w-56 shrink-0 xl:block"
      >
        <TableOfContents headings={headings} />
      </div>
    </div>
  );
}
