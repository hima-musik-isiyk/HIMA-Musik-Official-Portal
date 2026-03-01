"use client";

import Link from "next/link";
import React, { useMemo, useRef } from "react";

import { FEATURES } from "@/lib/feature-flags";
import type { DocMeta } from "@/lib/notion";
import {
  createCommandPaletteShortcutEvent,
  SHORTCUT_SYMBOL_CLASS,
  tokenizeShortcutLabel,
  useCommandPaletteShortcutLabel,
} from "@/lib/shortcut";
import useViewEntrance from "@/lib/useViewEntrance";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Category metadata                                                  */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  {
    key: "Legalitas",
    title: "Regulasi & Konstitusi",
    description:
      "AD/ART sebagai konstitusi organisasi, garis besar haluan, dan landasan peraturan HIMA MUSIK.",
  },
  {
    key: "Panduan & SOP",
    title: "Panduan & SOP",
    description:
      "Prosedur operasional standar: pengajuan proposal, aturan penggunaan fasilitas, dan birokrasi kampus.",
  },
  {
    key: "Arsip",
    title: "Arsip Transparansi",
    description:
      "Hasil rapat BPH, laporan keuangan kuartalan, dan evaluasi program kerja — terbuka untuk seluruh anggota.",
  },
  {
    key: "Templat",
    title: "Layanan Persuratan",
    description:
      "Format surat resmi, formulir peminjaman, dan templat dokumen organisasi siap pakai.",
  },
  {
    key: "Identitas",
    title: "Identitas Visual",
    description:
      "Panduan penggunaan logo, warna resmi, tipografi, dan aset visual identitas HIMA MUSIK.",
  },
  {
    key: "KKM",
    title: "Regulasi KKM",
    description:
      "AD/ART Pasal 26-27: aturan pendirian, hak & kewajiban, serta tata kelola 8 KKM di bawah naungan HIMA MUSIK.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface DocsPortalViewProps {
  docs: DocMeta[];
}

export default function DocsPortalView({ docs }: DocsPortalViewProps) {
  const commandPaletteShortcutLabel = useCommandPaletteShortcutLabel();
  const scopeRef = useViewEntrance("/sekretariat");
  const cardsRef = useRef<HTMLDivElement>(null);

  // Grouping & Recently Updated calculations
  const { groupedDocs, recentlyUpdated } = useMemo(() => {
    const grouped: Record<string, DocMeta[]> = {};

    for (const doc of docs) {
      const cat = doc.category || "Umum";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(doc);
    }

    const sortedUpdated = [...docs]
      .sort(
        (a, b) =>
          new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime(),
      )
      .slice(0, 3);

    return {
      groupedDocs: grouped,
      recentlyUpdated: sortedUpdated,
    };
  }, [docs]);

  return (
    <div
      ref={scopeRef}
      className="relative flex-1 px-6 pt-16 pb-24 md:px-10 lg:px-16"
    >
      {/* Hero Header */}
      <div data-animate="up" className="mb-16 max-w-4xl">
        <div className="mb-4 flex items-center gap-4">
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
          <span className="text-[0.65rem] font-medium tracking-[0.4em] text-stone-600 uppercase">
            Official Portal
          </span>
        </div>
        <h1 className="font-serif text-5xl leading-tight font-normal text-white md:text-7xl">
          Sekretariat <br />
          <span className="font-light text-stone-500 italic">HIMA MUSIK</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-400">
          Pusat administrasi terpadu untuk regulasi, konstitusi, dan arsip
          transparansi organisasi. Kami mengedepankan akuntabilitas dalam setiap
          dokumentasi.
        </p>

        {/* Search hint */}
        <div className="mt-10">
          <button
            onClick={() => {
              window.dispatchEvent(createCommandPaletteShortcutEvent());
            }}
            className="group flex w-full max-w-md items-center gap-4 rounded-xl border border-stone-800/80 bg-stone-900/30 px-6 py-4 text-sm text-stone-400 transition-colors hover:border-stone-700 hover:bg-stone-900/50"
          >
            <svg
              className="text-gold-500 h-5 w-5 transition-transform group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="flex-1 text-left">
              Cari AD/ART, SOP, atau Notulensi Rapat...
            </span>
            <kbd className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-stone-500">
              {tokenizeShortcutLabel(commandPaletteShortcutLabel).map(
                (token, index) => (
                  <span
                    key={`${token.char}-${index}`}
                    className={token.isSymbol ? SHORTCUT_SYMBOL_CLASS : ""}
                  >
                    {token.char}
                  </span>
                ),
              )}
            </kbd>
          </button>
        </div>
      </div>

      {/* Main Grid: Categories & Recent */}
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Left Columns: Category Cards */}
        <div
          ref={cardsRef}
          className={cn(
            "grid gap-6 md:grid-cols-2",
            FEATURES.SHOW_DOCS_SIDEBAR ? "lg:col-span-2" : "lg:col-span-3",
          )}
        >
          {CATEGORIES.map((cat) => {
            const catDocs = groupedDocs[cat.key] ?? [];
            return (
              <div
                key={cat.key}
                className="group relative flex flex-col border border-white/5 p-7 transition-colors hover:bg-stone-900/10"
                data-animate="up"
              >
                <div className="relative mb-6">
                  <p className="mb-2 text-[0.65rem] font-medium tracking-[0.2em] text-stone-500 uppercase">
                    {cat.key}
                  </p>
                  <h2 className="group-hover:text-gold-400 font-serif text-2xl text-white transition-colors">
                    {cat.title}
                  </h2>
                </div>

                <p className="mb-8 text-[0.8125rem] leading-relaxed text-stone-500 transition-colors group-hover:text-stone-400">
                  {cat.description}
                </p>

                <div className="mt-auto">
                  {catDocs.length > 0 ? (
                    <div className="space-y-2">
                      {catDocs.slice(0, 4).map((doc) => (
                        <Link
                          key={doc.id}
                          href={`/sekretariat/${doc.slug}`}
                          className="group/link flex items-center gap-3 rounded-xl border border-transparent px-4 py-2.5 text-xs text-stone-400 transition-colors hover:border-stone-800 hover:bg-stone-900/40 hover:text-white"
                        >
                          <span className="group-hover/link:text-gold-400 text-stone-600 transition-colors">
                            {doc.icon || (
                              <svg
                                className="h-3 w-3"
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
                            )}
                          </span>
                          <span className="flex-1 truncate">{doc.title}</span>
                        </Link>
                      ))}
                      {catDocs.length > 4 && (
                        <p className="mt-3 text-center text-[0.65rem] font-medium tracking-wide text-stone-600">
                          +{catDocs.length - 4} DOKUMEN LAINNYA
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="border-t border-dashed border-stone-800/50 py-8 text-center text-stone-600">
                      <p className="text-[0.65rem] tracking-wider italic">
                        Belum ada dokumen tersedia.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Sidebar (Recently Updated & Forms) */}
        {FEATURES.SHOW_DOCS_SIDEBAR && (
          <div className="space-y-6">
            {/* Recently Updated */}
            <div
              data-animate="left"
              className="border border-white/5 p-8 transition-colors hover:bg-stone-900/10"
            >
              <div className="mb-6 flex items-center gap-4">
                <span
                  className="bg-gold-500/40 block h-px w-6"
                  aria-hidden="true"
                />
                <h3 className="font-serif text-xl text-white">
                  Update Terbaru
                </h3>
              </div>
              <div className="space-y-6">
                {recentlyUpdated.length > 0 ? (
                  recentlyUpdated.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/sekretariat/${doc.slug}`}
                      className="group block"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="group-hover:text-gold-400 truncate text-sm font-medium text-stone-300 transition-colors">
                          {doc.title}
                        </h4>
                        <span className="shrink-0 text-[10px] text-stone-600 uppercase">
                          {new Date(doc.lastEdited).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] tracking-wider text-stone-500">
                        {doc.category}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-stone-600">Belum ada aktivitas.</p>
                )}
              </div>
              <Link
                href="/sekretariat/archives"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900/30 py-3 text-[0.65rem] font-medium tracking-[0.2em] text-stone-500 uppercase transition-colors hover:border-stone-700 hover:text-white"
              >
                Lihat Histori Lengkap
              </Link>
            </div>

            {/* Quick Forms Section */}
            <div
              data-animate="left"
              className="border border-white/5 p-8 transition-colors hover:bg-stone-900/10"
            >
              <h3 className="mb-3 font-serif text-xl text-white">
                Layanan Mandiri
              </h3>
              <p className="mb-6 text-xs leading-relaxed text-stone-400">
                Butuh surat pengantar atau peminjaman alat? Ajukan langsung
                secara online.
              </p>
              <div className="space-y-3">
                {[
                  {
                    label: "Surat Aktif Organisasi",
                    href: "/sekretariat/forms/surat-aktif",
                  },
                  {
                    label: "Peminjaman Alat Musik",
                    href: "/sekretariat/forms/peminjaman-alat",
                  },
                ].map((form) => (
                  <Link
                    key={form.href}
                    href={form.href}
                    className="group/form flex items-center justify-between rounded-xl border border-stone-800/80 bg-stone-900/30 px-5 py-4 text-sm text-stone-300 transition-colors hover:border-stone-700 hover:bg-stone-900/50 hover:text-white"
                  >
                    {form.label}
                    <svg
                      className="group-hover/form:text-gold-400 h-4 w-4 text-stone-600 transition-transform group-hover/form:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Accents */}
      <div data-animate="up" className="mt-24 text-center">
        <div className="mb-4 flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-white/5" />
          <div className="bg-gold-500/50 h-1.5 w-1.5 rounded-full" />
          <div className="h-px w-12 bg-white/5" />
        </div>
        <p className="text-[0.6rem] tracking-[0.3em] text-stone-600 uppercase">
          Sekretariat Jenderal HIMA MUSIK © 2024-2026
        </p>
      </div>
    </div>
  );
}
