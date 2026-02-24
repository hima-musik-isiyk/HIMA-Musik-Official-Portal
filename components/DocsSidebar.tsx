"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import type { DocMeta } from "@/lib/notion";

/* ------------------------------------------------------------------ */
/*  Group docs by category                                             */
/* ------------------------------------------------------------------ */

interface GroupedDocs {
  [category: string]: DocMeta[];
}

function groupByCategory(docs: DocMeta[]): GroupedDocs {
  const groups: GroupedDocs = {};
  for (const doc of docs) {
    const cat = doc.category || "Umum";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(doc);
  }
  return groups;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface DocsSidebarProps {
  docs: DocMeta[];
}

export default function DocsSidebar({ docs }: DocsSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const grouped = groupByCategory(docs);

  /* Auto-expand category of current active page */
  useEffect(() => {
    const currentSlug = pathname?.replace("/docs/", "").replace("/docs", "");
    for (const [cat, catDocs] of Object.entries(grouped)) {
      if (catDocs.some((d) => d.slug === currentSlug)) {
        setExpandedCategories((prev) => new Set([...prev, cat]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Close mobile sidebar on nav */
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="hover:border-gold-500/30 fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-stone-900/90 text-white shadow-xl backdrop-blur-xl transition-colors lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {isMobileOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-20 left-0 z-30 h-[calc(100vh-5rem)] w-72 transform overflow-y-auto border-r border-white/5 bg-[#0a0a0a]/95 px-4 py-6 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:z-0 lg:translate-x-0 lg:bg-transparent lg:backdrop-blur-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/docs"
            className="group flex items-center gap-2 text-sm font-semibold tracking-[0.2em] uppercase"
          >
            <span className="text-gold-500 group-hover:text-gold-300 transition-colors">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </span>
            <span className="group-hover:text-gold-300 text-white transition-colors">
              Pusat Docs
            </span>
          </Link>
        </div>

        {/* Navigation tree */}
        <nav className="space-y-1">
          {Object.entries(grouped).map(([category, catDocs]) => {
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold tracking-wider text-stone-400 uppercase transition-colors hover:bg-white/5 hover:text-white"
                >
                  <span className="flex-1">{category}</span>
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="ml-3 space-y-0.5 border-l border-stone-800 pl-3">
                    {catDocs.map((doc) => {
                      const currentSlug = pathname
                        ?.replace("/docs/", "")
                        .replace("/docs", "");
                      const isActive = currentSlug === doc.slug;

                      return (
                        <Link
                          key={doc.id}
                          href={`/docs/${doc.slug}`}
                          className={`block rounded-md px-3 py-1.5 text-sm transition-all duration-200 ${
                            isActive
                              ? "bg-gold-500/10 text-gold-300 font-medium"
                              : "text-stone-500 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {doc.icon && (
                            <span className="mr-1.5">{doc.icon}</span>
                          )}
                          {doc.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Empty state */}
        {docs.length === 0 && (
          <div className="mt-8 rounded-lg border border-dashed border-stone-800 p-6 text-center">
            <p className="text-sm text-stone-500">
              Belum ada dokumen terpublikasi.
            </p>
            <p className="mt-2 text-xs text-stone-600">
              Dokumen akan muncul setelah Sekretaris mempublikasi dari Notion.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
