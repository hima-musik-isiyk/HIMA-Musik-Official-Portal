"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import type { ArchiveEntry } from "@/lib/notion";

interface ArchivesViewProps {
  entries: ArchiveEntry[];
  allTags: string[];
}

export default function ArchivesView({ entries, allTags }: ArchivesViewProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!activeTag) return entries;
    return entries.filter((e) => e.tags.includes(activeTag));
  }, [entries, activeTag]);

  const TAG_COLORS: Record<string, string> = {
    Keuangan: "bg-green-500/10 text-green-400 border-green-500/20",
    Akademik: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Program Kerja": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Internal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div className="flex-1 px-6 py-10 md:px-10 lg:px-16">
      {/* Header */}
      <div className="mb-10">
        <nav className="mb-4 flex items-center gap-2 text-xs text-stone-500">
          <Link
            href="/sekretariat"
            className="transition-colors hover:text-stone-300"
          >
            Sekretariat
          </Link>
          <span>/</span>
          <span className="text-gold-400">Arsip Transparansi</span>
        </nav>

        <h1 className="font-serif text-3xl font-bold text-white md:text-4xl">
          Arsip Transparansi
        </h1>
        <p className="mt-3 max-w-2xl text-stone-400">
          Rangkuman hasil rapat BPH, evaluasi program kerja, dan laporan
          keuangan. Semua ringkasan publik dipublikasi langsung oleh Sekretaris.
        </p>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full border px-3 py-1 text-xs tracking-wider transition-colors ${
              activeTag === null
                ? "border-gold-500/30 bg-gold-500/10 text-gold-300"
                : "border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-400"
            }`}
          >
            Semua
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`rounded-full border px-3 py-1 text-xs tracking-wider transition-colors ${
                activeTag === tag
                  ? (TAG_COLORS[tag] ??
                    "border-gold-500/30 bg-gold-500/10 text-gold-300")
                  : "border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-400"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Entries */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((entry) => {
            const formattedDate = entry.date
              ? new Date(entry.date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : null;

            return (
              <Link
                key={entry.id}
                href={`/sekretariat/archives/${entry.id}`}
                className="group hover:border-gold-500/20 block rounded-xl border border-stone-800 bg-stone-900/30 p-6 transition-all hover:bg-stone-900/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="group-hover:text-gold-300 font-serif text-lg font-semibold text-white">
                      {entry.title}
                    </h3>
                    {entry.summary && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-400">
                        {entry.summary}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {formattedDate && (
                        <span className="text-xs text-stone-500">
                          {formattedDate}
                        </span>
                      )}
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${
                            TAG_COLORS[tag] ?? "border-stone-700 text-stone-500"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg
                    className="group-hover:text-gold-400 h-5 w-5 shrink-0 text-stone-600 transition-colors"
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
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-800 bg-stone-900/20 p-12 text-center">
          <p className="text-sm text-stone-500">
            {activeTag
              ? `Belum ada arsip dengan tag "${activeTag}".`
              : "Belum ada arsip yang dipublikasi."}
          </p>
          <p className="mt-2 text-xs text-stone-600">
            Arsip akan tampil setelah Sekretaris mencentang &quot;Publish to
            Web&quot; di Notion.
          </p>
        </div>
      )}
    </div>
  );
}
