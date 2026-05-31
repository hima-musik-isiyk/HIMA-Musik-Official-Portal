"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import {
  IconChevronDown,
  IconExternalLink,
  IconMusic,
} from "@/components/Icons";
import { type KaryaEntryMeta } from "@/lib/notion";
import useViewEntrance from "@/lib/useViewEntrance";

interface KaryaViewProps {
  entries: KaryaEntryMeta[];
}

const ACTION_RADIUS = { borderRadius: "var(--radius-action)" } as const;

export default function KaryaView({ entries: initialEntries }: KaryaViewProps) {
  const scopeRef = useViewEntrance("/karya");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [entries, setEntries] = useState<KaryaEntryMeta[]>(
    initialEntries || [],
  );

  useEffect(() => {
    // Try to load from localStorage cache first to bootstrap client-side SWR
    try {
      const cached = window.localStorage.getItem("hima_karya_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        setEntries((prev) => (prev && prev.length > 0 ? prev : parsed || []));
      }
    } catch {}

    const fetchKaryaData = async () => {
      try {
        const res = await fetch("/api/karya");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setEntries(result.data);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                "hima_karya_cache",
                JSON.stringify(result.data),
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch fresh karya data:", err);
      }
    };

    fetchKaryaData();

    const interval = setInterval(() => {
      fetchKaryaData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const GENRES = [
    "Klasik",
    "Jazz",
    "Pop",
    "Rock",
    "Folk",
    "Elektronik",
    "Eksperimental",
    "Lainnya",
  ];
  const PLATFORMS = [
    "YouTube",
    "Spotify",
    "SoundCloud",
    "Apple Music",
    "Lainnya",
  ];

  // Filtering Logic
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.creator.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre =
      selectedGenre === "all" || entry.genres.includes(selectedGenre);

    const matchesPlatform =
      selectedPlatform === "all" ||
      entry.platform === selectedPlatform ||
      (entry.platforms && entry.platforms.includes(selectedPlatform));

    return matchesSearch && matchesGenre && matchesPlatform;
  });

  return (
    <div
      ref={scopeRef}
      className="relative min-h-screen overflow-x-hidden px-6 pt-40 pb-32 md:px-10 lg:px-16"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,166,77,0.03)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <header className="relative mb-16 flex flex-col items-start justify-between border-b border-white/5 pb-10 md:flex-row md:items-end">
          <div className="bg-gold-500/50 absolute bottom-0 left-0 h-px w-32" />
          <div>
            <div data-animate="up" className="mb-6 flex items-center gap-4">
              <span
                className="bg-gold-500/40 block h-px w-8 md:w-12"
                aria-hidden="true"
              />
              <p className="text-gold-500 text-sm font-medium">
                Etalase Kreativitas
              </p>
            </div>
            <h1
              data-animate="up"
              data-animate-delay="0.1"
              className="font-serif text-5xl tracking-tight text-white md:text-7xl"
            >
              Karya &{" "}
              <span className="text-gold-500/80 font-light italic">
                Mahasiswa
              </span>
            </h1>
          </div>
          <div
            data-animate="up"
            data-animate-delay="0.2"
            className="mt-6 md:mt-0"
          >
            <Link
              href="/karya/submit"
              target="_blank"
              rel="noopener noreferrer"
              className="border-gold-500/30 bg-gold-500/10 text-gold-300 hover:border-gold-500/60 hover:bg-gold-500/20 inline-flex items-center gap-2 border px-5 py-2.5 text-xs font-semibold tracking-widest uppercase transition duration-300 hover:text-white"
              style={ACTION_RADIUS}
            >
              Submit Karya
              <IconExternalLink width={13} height={13} />
            </Link>
          </div>
        </header>

        {/* Content Section */}
        <div className="space-y-8">
          {/* Filters Dashboard */}
          <div
            data-animate="up"
            className="flex flex-col gap-4 border border-white/5 bg-[#111]/40 p-6 md:flex-row md:items-center md:justify-between"
            style={ACTION_RADIUS}
          >
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <input
                type="text"
                placeholder="Cari judul karya atau nama penampil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:border-gold-500/80 focus:ring-gold-500/80 w-full border border-white/10 bg-black/40 px-4 py-2.5 pl-10 text-sm text-neutral-200 placeholder-neutral-500 transition-colors focus:ring-1 focus:outline-none"
                style={ACTION_RADIUS}
              />
              <svg
                className="absolute top-3.5 left-3.5 h-3.5 w-3.5 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filtering Controls */}
            <div className="flex flex-wrap gap-3">
              {/* Genre Filter */}
              <div className="group relative">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="focus:border-gold-500/80 appearance-none border border-white/10 bg-black/40 px-4 py-2.5 pr-10 text-xs text-neutral-300 transition-colors focus:outline-none"
                  style={ACTION_RADIUS}
                >
                  <option className="bg-[#111] text-neutral-300" value="all">
                    Semua Genre
                  </option>
                  {GENRES.map((g) => (
                    <option
                      className="bg-[#111] text-neutral-300"
                      key={g}
                      value={g}
                    >
                      {g}
                    </option>
                  ))}
                </select>
                <div className="text-gold-500/60 group-focus-within:text-gold-300 pointer-events-none absolute top-0 right-0 bottom-0 flex items-center pr-3 transition-colors duration-300">
                  <IconChevronDown width={12} height={12} />
                </div>
              </div>

              {/* Platform Filter */}
              <div className="group relative">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="focus:border-gold-500/80 appearance-none border border-white/10 bg-black/40 px-4 py-2.5 pr-10 text-xs text-neutral-300 transition-colors focus:outline-none"
                  style={ACTION_RADIUS}
                >
                  <option className="bg-[#111] text-neutral-300" value="all">
                    Semua Platform
                  </option>
                  {PLATFORMS.map((p) => (
                    <option
                      className="bg-[#111] text-neutral-300"
                      key={p}
                      value={p}
                    >
                      {p}
                    </option>
                  ))}
                </select>
                <div className="text-gold-500/60 group-focus-within:text-gold-300 pointer-events-none absolute top-0 right-0 bottom-0 flex items-center pr-3 transition-colors duration-300">
                  <IconChevronDown width={12} height={12} />
                </div>
              </div>
            </div>
          </div>

          {/* Works Gallery Grid */}
          <div
            data-animate="up"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredEntries.length === 0 ? (
              <div className="col-span-full py-24 text-center">
                <IconMusic className="mx-auto mb-4 h-12 w-12 text-stone-700" />
                <p className="font-light text-stone-500">
                  Tidak ada karya yang sesuai dengan kriteria pencarian.
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="group hover:border-gold-500/30 flex flex-col overflow-hidden border border-white/5 bg-[#111]/40 backdrop-blur-md transition-all duration-300"
                  style={ACTION_RADIUS}
                >
                  {/* Media Artwork / Embed Area */}
                  <div className="relative h-48 w-full overflow-hidden bg-black/50">
                    {playingId === entry.id ? (
                      <iframe
                        src={entry.embedUrl}
                        className="h-full w-full border-0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        {entry.artworkUrl ? (
                          <img
                            src={entry.artworkUrl}
                            alt={entry.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-900 to-stone-950">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,166,77,0.04)_0%,transparent_70%)]" />
                            <IconMusic className="h-10 w-10 text-neutral-800" />
                          </div>
                        )}

                        {/* Hover Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                          <button
                            onClick={() => setPlayingId(entry.id)}
                            className="bg-gold-500 hover:bg-gold-400 flex translate-y-2 transform items-center justify-center rounded-full p-4 text-neutral-950 shadow-lg transition-all duration-300 group-hover:translate-y-0 hover:scale-110"
                          >
                            <svg
                              className="ml-0.5 h-5 w-5 fill-current"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Card Content Details */}
                  <div className="flex flex-1 flex-col p-6">
                    {/* Top Header Row */}
                    <div className="mb-4 flex items-center justify-between">
                      <span
                        className={`border px-2.5 py-1 text-[9px] font-semibold tracking-[0.15em] uppercase ${
                          entry.platform === "Spotify"
                            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                            : entry.platform === "YouTube"
                              ? "border-red-500/20 bg-red-500/5 text-red-400"
                              : entry.platform === "SoundCloud"
                                ? "border-orange-500/20 bg-orange-500/5 text-orange-400"
                                : entry.platform === "Apple Music"
                                  ? "border-pink-500/20 bg-pink-500/5 text-pink-400"
                                  : "border-gold-500/20 text-gold-400 bg-gold-500/5"
                        }`}
                      >
                        {entry.platform}
                      </span>

                      <a
                        href={entry.embedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-500 transition-colors hover:text-white"
                        title="Buka Platform Utama"
                      >
                        <IconExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    {/* Title & Creator */}
                    <h3 className="group-hover:text-gold-400 mb-2 line-clamp-2 font-serif text-xl leading-snug text-white transition-colors duration-300">
                      {entry.title}
                    </h3>
                    <p className="mb-4 text-xs font-light text-neutral-400">
                      Oleh {entry.creator}{" "}
                      {entry.nim && entry.nim !== 999 && `(NIM: ${entry.nim})`}
                    </p>

                    {/* Genres list */}
                    <div className="mt-auto flex flex-wrap gap-1.5 border-t border-white/5 pt-4">
                      {entry.genres.map((g) => (
                        <span
                          key={g}
                          className="group-hover:border-gold-500/10 group-hover:text-gold-500/60 border border-white/5 bg-white/5 px-2.5 py-0.5 text-[9px] font-medium tracking-wide text-neutral-500 uppercase transition-colors"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    {/* Date & Control Footer */}
                    <div className="mt-4 flex items-center justify-between text-[10px] font-medium text-neutral-600">
                      <span>{entry.submissionDate}</span>

                      {playingId === entry.id && (
                        <button
                          onClick={() => setPlayingId(null)}
                          className="font-bold tracking-widest text-red-400/80 uppercase transition-colors hover:text-red-400"
                        >
                          Hentikan Player
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
