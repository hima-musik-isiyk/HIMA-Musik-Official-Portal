"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  SHORTCUT_SYMBOL_CLASS,
  tokenizeShortcutLabel,
  useCommandPaletteShortcutLabel,
} from "@/lib/shortcut";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  category: string;
  highlight: string;
}

const STATIC_PAGES: SearchResult[] = [
  {
    id: "home",
    title: "Beranda",
    slug: "/",
    category: "Navigasi",
    highlight: "Halaman utama HIMA MUSIK",
  },
  {
    id: "about",
    title: "Tentang Kami",
    slug: "/about",
    category: "Navigasi",
    highlight: "Profil organisasi & kabinet",
  },
  {
    id: "events",
    title: "Kalender Acara",
    slug: "/events",
    category: "Navigasi",
    highlight: "Agenda & program kerja",
  },
  {
    id: "gallery",
    title: "Galeri Visual",
    slug: "/gallery",
    category: "Navigasi",
    highlight: "Dokumentasi kegiatan",
  },
  {
    id: "aduan",
    title: "Ruang Advokasi",
    slug: "/aduan",
    category: "Layanan",
    highlight: "Layanan aduan mahasiswa",
  },
  {
    id: "pendaftaran",
    title: "Open Recruitment",
    slug: "/pendaftaran",
    category: "Layanan",
    highlight: "Pendaftaran anggota baru",
  },
  {
    id: "docs",
    title: "Pusat Administrasi & Docs",
    slug: "/docs",
    category: "Layanan",
    highlight: "Portal dokumen & SOP organisasi",
  },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const commandPaletteShortcutLabel = useCommandPaletteShortcutLabel();

  const _open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }, []);

  /* Global keyboard shortcut Cmd+K / Ctrl+K */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  /* Focus input when opened */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* Search logic */
  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults(STATIC_PAGES);
      setActiveIndex(0);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const staticMatches = STATIC_PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.highlight.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery),
    );

    setResults(staticMatches);
    setActiveIndex(0);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/docs/search?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { results: SearchResult[] };
          const notionResults = data.results.map((r) => ({
            ...r,
            slug: `/docs/${r.slug}`,
          }));
          const merged = [...staticMatches];
          for (const nr of notionResults) {
            if (!merged.some((m) => m.id === nr.id)) {
              merged.push(nr);
            }
          }
          setResults(merged);
        }
      } catch {
        /* Notion search unavailable, keep static results */
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen]);

  /* Keyboard navigation */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = results[activeIndex];
      if (selected) {
        navigate(selected.slug);
      }
    }
  };

  /* Scroll active item into view */
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const navigate = (slug: string) => {
    close();
    router.push(slug);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-stone-900/90 shadow-2xl backdrop-blur-xl">
        {/* Search input */}
        <div className="flex items-center border-b border-white/10 px-4">
          <svg
            className="mr-3 h-5 w-5 shrink-0 text-stone-500"
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
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari dokumen, halaman, atau SOP..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-14 w-full bg-transparent text-sm text-white placeholder:text-stone-500 focus:outline-none"
          />
          <kbd className="ml-3 shrink-0 rounded border border-stone-700 bg-stone-800 px-2 py-1 font-mono text-[10px] text-stone-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto overscroll-contain p-2"
        >
          {results.length === 0 && query.trim() && !isLoading && (
            <div className="px-4 py-8 text-center text-sm text-stone-500">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;
            </div>
          )}

          {results.map((result, idx) => (
            <button
              key={result.id}
              onClick={() => navigate(result.slug)}
              className={`flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left transition-all ${
                idx === activeIndex
                  ? "border-gold-500 text-white"
                  : "border-transparent text-stone-400 hover:border-stone-700 hover:text-white"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {result.title}
                </div>
                <div className="truncate text-xs text-stone-500">
                  {result.highlight}
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-stone-500 italic">
                {result.category}
              </span>
            </button>
          ))}

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="border-gold-500 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="ml-2 text-xs text-stone-500">
                Mencari di Notion...
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-[10px] text-stone-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-stone-700 bg-stone-800 px-1.5 py-0.5">
                {tokenizeShortcutLabel("↑↓").map((token, index) => (
                  <span
                    key={`${token.char}-${index}`}
                    className={token.isSymbol ? SHORTCUT_SYMBOL_CLASS : ""}
                  >
                    {token.char}
                  </span>
                ))}
              </kbd>
              navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-stone-700 bg-stone-800 px-1.5 py-0.5">
                {tokenizeShortcutLabel("↵").map((token, index) => (
                  <span
                    key={`${token.char}-${index}`}
                    className={token.isSymbol ? SHORTCUT_SYMBOL_CLASS : ""}
                  >
                    {token.char}
                  </span>
                ))}
              </kbd>
              buka
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-stone-700 bg-stone-800 px-1.5 py-0.5">
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
            pencarian
          </span>
        </div>
      </div>
    </div>
  );
}
