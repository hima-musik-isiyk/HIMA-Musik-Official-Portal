"use client";

import Link from "next/link";
import React from "react";

import NotionRenderer, { extractHeadings } from "@/components/NotionRenderer";
import TableOfContents from "@/components/TableOfContents";
import type { DocMeta, NotionBlock } from "@/lib/notion";

interface DocPageViewProps {
  meta: DocMeta;
  blocks: NotionBlock[];
}

export default function DocPageView({ meta, blocks }: DocPageViewProps) {
  const headings = extractHeadings(blocks);

  const formattedDate = meta.lastEdited
    ? new Date(meta.lastEdited).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex gap-8 px-6 py-10 md:px-10 lg:px-16">
      {/* Center: Reading Pane */}
      <article className="max-w-3xl min-w-0 flex-1">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/docs" className="transition-colors hover:text-stone-300">
            Docs
          </Link>
          <span>/</span>
          <span className="text-stone-400">{meta.category}</span>
          <span>/</span>
          <span className="text-gold-400">{meta.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            {meta.icon && <span className="text-2xl">{meta.icon}</span>}
            <span className="rounded-md bg-stone-800/80 px-2.5 py-0.5 text-xs tracking-wider text-stone-400 uppercase">
              {meta.category}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {meta.title}
          </h1>
          {formattedDate && (
            <p className="mt-3 text-sm text-stone-500">
              Terakhir diperbarui: {formattedDate}
            </p>
          )}
        </header>

        {/* Content */}
        <div className="prose-docs">
          <NotionRenderer blocks={blocks} />
        </div>

        {/* Bottom nav */}
        <div className="mt-16 border-t border-stone-800 pt-8">
          <Link
            href="/docs"
            className="text-gold-400 hover:text-gold-300 text-sm transition-colors"
          >
            ← Kembali ke Pusat Docs
          </Link>
        </div>
      </article>

      {/* Right: Table of Contents */}
      <div className="w-56 shrink-0">
        <TableOfContents headings={headings} />
      </div>
    </div>
  );
}
