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
  },
  {
    key: "Panduan & SOP",
    title: "Panduan & SOP",
    description:
      "Prosedur operasional standar: peminjaman alat, pengajuan proposal, dan aturan penggunaan fasilitas.",
  },
  {
    key: "Arsip",
    title: "Arsip Transparansi",
    description:
      "Hasil rapat BPH, laporan keuangan kuartalan, dan evaluasi program kerja — terbuka untuk seluruh anggota.",
  },
  {
    key: "Templat",
    title: "Templat & Formulir",
    description:
      "Format surat resmi, formulir peminjaman, dan templat dokumen organisasi siap pakai.",
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
        <div className="mb-4">
          <p className="text-[0.65rem] tracking-[0.3em] text-stone-500 uppercase">
            Portal Dokumen
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-white md:text-5xl">
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
              className="group border-gold-500/30 border-l py-5 pr-4 pl-5 transition-all duration-300"
            >
              <p className="mb-1 text-[0.65rem] tracking-[0.3em] text-stone-500 uppercase">
                {cat.key}
              </p>
              <h2 className="font-serif text-xl font-bold text-white">
                {cat.title}
              </h2>
              <p className="mt-2 mb-4 text-sm leading-relaxed text-stone-400">
                {cat.description}
              </p>

              {catDocs.length > 0 ? (
                <div className="space-y-1">
                  {catDocs.slice(0, 5).map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/docs/${doc.slug}`}
                      className="group/link flex items-start gap-2 py-1 text-sm text-stone-400 transition-colors hover:text-white"
                    >
                      <span className="mt-0.5 shrink-0 text-stone-600 select-none">
                        —
                      </span>
                      <span className="flex-1">{doc.title}</span>
                    </Link>
                  ))}
                  {catDocs.length > 5 && (
                    <p className="pl-4 text-xs text-stone-600">
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
        <p className="mb-1 text-[0.65rem] tracking-[0.3em] text-stone-500 uppercase">
          Formulir Interaktif
        </p>
        <h2 className="mb-6 font-serif text-2xl font-bold text-white">
          Pengajuan Online
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/docs/forms/surat-aktif"
            className="group border-gold-500/30 hover:border-gold-500/60 border-l py-5 pr-4 pl-5 transition-all duration-300"
          >
            <p className="text-[0.65rem] tracking-[0.3em] text-stone-500 uppercase">
              Surat Keterangan
            </p>
            <h3 className="group-hover:text-gold-300 mt-1 font-serif text-lg font-bold text-white transition-colors">
              Pengajuan Surat Aktif Organisasi
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Ajukan surat keterangan aktif organisasi secara digital.
            </p>
          </Link>
          <Link
            href="/docs/forms/peminjaman-alat"
            className="group border-gold-500/30 hover:border-gold-500/60 border-l py-5 pr-4 pl-5 transition-all duration-300"
          >
            <p className="text-[0.65rem] tracking-[0.3em] text-stone-500 uppercase">
              Fasilitas
            </p>
            <h3 className="group-hover:text-gold-300 mt-1 font-serif text-lg font-bold text-white transition-colors">
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
