"use client";

import Link from "next/link";
import React from "react";

import NotionRenderer, { extractHeadings } from "@/components/NotionRenderer";
import TableOfContents from "@/components/TableOfContents";
import type { ArchiveEntry, NotionBlock } from "@/lib/notion";

interface ArchiveDetailViewProps {
  entry: ArchiveEntry;
  blocks: NotionBlock[];
}

export default function ArchiveDetailView({
  entry,
  blocks,
}: ArchiveDetailViewProps) {
  const headings = extractHeadings(blocks);

  const formattedDate = entry.date
    ? new Date(entry.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex gap-8 px-6 py-10 md:px-10 lg:px-16">
      {/* Reading Pane */}
      <article className="max-w-3xl min-w-0 flex-1">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link href="/docs" className="transition-colors hover:text-stone-300">
            Docs
          </Link>
          <span>/</span>
          <Link
            href="/docs/archives"
            className="transition-colors hover:text-stone-300"
          >
            Arsip
          </Link>
          <span>/</span>
          <span className="text-gold-400">{entry.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="font-serif text-3xl font-bold text-white md:text-4xl">
            {entry.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {formattedDate && (
              <span className="text-sm text-stone-500">{formattedDate}</span>
            )}
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-stone-700 px-2.5 py-0.5 text-xs text-stone-400"
              >
                {tag}
              </span>
            ))}
          </div>

          {entry.summary && (
            <div className="border-gold-500 bg-gold-500/5 mt-6 rounded-lg border-l-4 py-3 pr-4 pl-5">
              <p className="text-sm leading-relaxed text-stone-300 italic">
                {entry.summary}
              </p>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="prose-docs">
          <NotionRenderer blocks={blocks} />
        </div>

        {/* Bottom nav */}
        <div className="mt-16 border-t border-stone-800 pt-8">
          <Link
            href="/docs/archives"
            className="text-gold-400 hover:text-gold-300 text-sm transition-colors"
          >
            ← Kembali ke Arsip
          </Link>
        </div>
      </article>

      {/* ToC */}
      <div className="w-56 shrink-0">
        <TableOfContents headings={headings} />
      </div>
    </div>
  );
}
