"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef } from "react";

import NotionRenderer, { extractHeadings } from "@/components/NotionRenderer";
import TableOfContents from "@/components/TableOfContents";
import { gsap } from "@/lib/gsap";
import type { ArchiveEntry, NotionBlock } from "@/lib/notion";
import { shouldRunViewEntrance } from "@/lib/view-entrance";

interface ArchiveDetailViewProps {
  entry: ArchiveEntry;
  blocks: NotionBlock[];
}

export default function ArchiveDetailView({
  entry,
  blocks,
}: ArchiveDetailViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const headings = extractHeadings(blocks);

  const formattedDate = entry.date
    ? new Date(entry.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    // Use the specific path to track entrance
    if (!shouldRunViewEntrance(pathname || "")) return;

    const ctx = gsap.context(() => {
      const defaults = { ease: "power3.out", duration: 0.8 };

      gsap.fromTo(
        ".ad-breadcrumb",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, ...defaults },
      );

      gsap.fromTo(
        ".ad-header",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, ...defaults, delay: 0.1 },
      );

      gsap.fromTo(
        ".ad-content",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, ...defaults, delay: 0.2 },
      );

      gsap.fromTo(
        ".ad-toc",
        { x: 20, opacity: 0 },
        { x: 0, opacity: 1, ...defaults, delay: 0.3 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [pathname]);

  return (
    <div ref={containerRef} className="flex gap-8 px-6 py-10 md:px-10 lg:px-16">
      {/* Reading Pane */}
      <article className="max-w-3xl min-w-0 flex-1">
        {/* Breadcrumb */}
        <nav className="ad-breadcrumb mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link
            href="/sekretariat"
            className="transition-colors hover:text-stone-300"
          >
            Sekretariat
          </Link>
          <span>/</span>
          <Link
            href="/sekretariat/archives"
            className="transition-colors hover:text-stone-300"
          >
            Arsip
          </Link>
          <span>/</span>
          <span className="text-gold-400">{entry.title}</span>
        </nav>

        {/* Header */}
        <header className="ad-header mb-10">
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
        <div className="ad-content prose-docs">
          <NotionRenderer blocks={blocks} />
        </div>

        {/* Bottom nav */}
        <div className="ad-content mt-16 border-t border-stone-800 pt-8">
          <Link
            href="/sekretariat/archives"
            className="text-gold-400 hover:text-gold-300 text-sm transition-colors"
          >
            ← Kembali ke Sekretariat Arsip
          </Link>
        </div>
      </article>

      {/* ToC */}
      <div className="ad-toc w-56 shrink-0">
        <TableOfContents headings={headings} />
      </div>
    </div>
  );
}
