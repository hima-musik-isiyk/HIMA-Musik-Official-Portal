"use client";

import Link from "next/link";
import React from "react";

import type { DocMeta } from "@/lib/notion";
import {
  createCommandPaletteShortcutEvent,
  SHORTCUT_SYMBOL_CLASS,
  tokenizeShortcutLabel,
  useCommandPaletteShortcutLabel,
} from "@/lib/shortcut";

/* ------------------------------------------------------------------ */
/*  Category metadata                                                  */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  {
    key: "Legalitas",
    title: "Garis Besar & Peraturan",
    description:
      "AD/ART, GBHK, dan Blueprint Organisasi — konstitusi yang menjadi landasan seluruh kegiatan HIMA MUSIK.",
    color: "from-amber-500/20 to-orange-600/10",
  },
  {
    key: "Panduan & SOP",
    title: "Panduan & SOP",
    description:
      "Prosedur operasional standar: peminjaman alat, pengajuan proposal, dan aturan penggunaan fasilitas.",
    color: "from-blue-500/20 to-indigo-600/10",
  },
  {
    key: "Arsip",
    title: "Arsip Transparansi",
    description:
      "Hasil rapat BPH, laporan keuangan kuartalan, dan evaluasi program kerja — terbuka untuk seluruh anggota.",
    color: "from-green-500/20 to-emerald-600/10",
  },
  {
    key: "Templat",
    title: "Templat & Formulir",
    description:
      "Format surat resmi, formulir peminjaman, dan templat dokumen organisasi siap pakai.",
    color: "from-purple-500/20 to-pink-600/10",
  },
];

const PORTAL_ICON_MAP: Record<string, React.ReactElement> = {
  Legalitas: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
      />
    </svg>
  ),
  "Panduan & SOP": (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  Arsip: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
      />
    </svg>
  ),
  Templat: (
    <svg
      className="h-5 w-5"
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
  ),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface DocsPortalViewProps {
  docs: DocMeta[];
}

export default function DocsPortalView({ docs }: DocsPortalViewProps) {
  const commandPaletteShortcutLabel = useCommandPaletteShortcutLabel();
  const groupedDocs: Record<string, DocMeta[]> = {};
  for (const doc of docs) {
    const cat = doc.category || "Umum";
    if (!groupedDocs[cat]) groupedDocs[cat] = [];
    groupedDocs[cat].push(doc);
  }

  return (
    <div className="flex-1 px-6 py-10 md:px-10 lg:px-16">
      {/* Hero */}
      <div className="mb-16">
        <div className="mb-4 flex items-center gap-4">
          <span className="text-gold-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-700 bg-stone-900">
            <svg
              className="h-5 w-5"
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
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">
            Pusat Administrasi
          </h1>
        </div>
        <p className="max-w-2xl text-lg leading-relaxed text-stone-400">
          Portal dokumen resmi, prosedur operasional, dan arsip transparansi
          HIMA MUSIK ISI Yogyakarta. Seluruh informasi dikelola langsung oleh
          Sekretaris melalui sistem headless CMS.
        </p>

        {/* Search hint */}
        <div className="mt-6">
          <button
            onClick={() => {
              window.dispatchEvent(createCommandPaletteShortcutEvent());
            }}
            className="inline-flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-900/50 px-5 py-3 text-sm text-stone-500 transition-all hover:border-stone-700 hover:text-stone-400"
          >
            <svg
              className="h-4 w-4"
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
            <span>Cari dokumen, SOP, atau arsip...</span>
            <kbd className="rounded border border-stone-700 bg-stone-800 px-2 py-0.5 font-mono text-[10px]">
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

      {/* Category Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const catDocs = groupedDocs[cat.key] ?? [];
          return (
            <div
              key={cat.key}
              className={`group rounded-2xl border border-white/5 bg-linear-to-br ${cat.color} p-6 transition-all duration-300 hover:border-white/10`}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="text-gold-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-700/60 bg-stone-900/80">
                  {PORTAL_ICON_MAP[cat.key]}
                </span>
                <h2 className="font-serif text-xl font-bold text-white">
                  {cat.title}
                </h2>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-stone-400">
                {cat.description}
              </p>

              {catDocs.length > 0 ? (
                <div className="space-y-1">
                  {catDocs.slice(0, 5).map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/docs/${doc.slug}`}
                      className="group/link flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {doc.icon && <span>{doc.icon}</span>}
                      <span className="flex-1">{doc.title}</span>
                      <svg
                        className="h-3 w-3 opacity-0 transition-opacity group-hover/link:opacity-100"
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
                    </Link>
                  ))}
                  {catDocs.length > 5 && (
                    <p className="px-3 text-xs text-stone-600">
                      +{catDocs.length - 5} dokumen lainnya
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-stone-600 italic">
                  Belum ada dokumen dalam kategori ini.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Archives section */}
      <div className="mt-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-white">
            Arsip Transparansi
          </h2>
          <Link
            href="/docs/archives"
            className="text-gold-400 hover:text-gold-300 text-sm transition-colors"
          >
            Lihat Semua →
          </Link>
        </div>
        <div className="rounded-xl border border-dashed border-stone-800 bg-stone-900/20 p-8 text-center">
          <p className="text-sm text-stone-500">
            Arsip rapat, laporan keuangan, dan evaluasi proker akan ditampilkan
            di sini setelah dipublish dari Notion.
          </p>
        </div>
      </div>

      {/* Quick forms section */}
      <div className="mt-16">
        <h2 className="mb-6 font-serif text-2xl font-bold text-white">
          Formulir Interaktif
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/docs/forms/surat-aktif"
            className="group hover:border-gold-500/20 rounded-xl border border-stone-800 bg-stone-900/30 p-6 transition-all hover:bg-stone-900/50"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-900 text-stone-400">
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
            </div>
            <h3 className="group-hover:text-gold-300 font-semibold text-white">
              Pengajuan Surat Aktif Organisasi
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Ajukan surat keterangan aktif organisasi secara digital.
            </p>
          </Link>
          <Link
            href="/docs/forms/peminjaman-alat"
            className="group hover:border-gold-500/20 rounded-xl border border-stone-800 bg-stone-900/30 p-6 transition-all hover:bg-stone-900/50"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-900 text-stone-400">
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
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <h3 className="group-hover:text-gold-300 font-semibold text-white">
              Peminjaman Alat Musik
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Form pengajuan peminjaman alat musik HIMA.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
