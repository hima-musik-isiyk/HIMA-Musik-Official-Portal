"use client";

import React, { useState } from "react";

import { IconExternalLink, IconMusic, IconSend } from "@/components/Icons";
import { type KaryaEntryMeta } from "@/lib/notion";
import useViewEntrance from "@/lib/useViewEntrance";

interface KaryaViewProps {
  entries: KaryaEntryMeta[];
}

const ACTION_RADIUS = { borderRadius: "var(--radius-action)" } as const;

export default function KaryaView({ entries }: KaryaViewProps) {
  const scopeRef = useViewEntrance("/karya");
  const [activeTab, setActiveTab] = useState<"explore" | "submit">("explore");
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    creator: "",
    nim: "",
    platform: "YouTube",
    genres: [] as string[],
    embedLink: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submit-karya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim karya");

      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim karya");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      className="relative min-h-screen overflow-x-hidden px-6 pt-40 pb-32"
    >
      <div className="pointer-events-none absolute inset-0 w-full bg-[radial-gradient(ellipse_at_top,rgba(212,166,77,0.03)_0%,transparent_70%)]"></div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div
          data-animate="up"
          className="mb-8 flex items-center justify-center gap-4"
        >
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
          <p className="text-gold-500 text-center text-sm font-medium">
            Etalase Kreativitas
          </p>
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
        </div>

        <div data-animate="up" className="mb-16 text-center">
          <h1 className="mb-6 font-serif text-5xl tracking-tight text-white md:text-7xl">
            Karya{" "}
            <span className="text-gold-500/80 font-light italic">
              Mahasiswa
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-neutral-400">
            Etalase digital karya dan kreativitas mahasiswa Program Studi Musik
            ISI Yogyakarta. Disubmit oleh mahasiswa, dikurasi oleh HIMA,
            dinikmati langsung.
          </p>
        </div>

        {/* Tabs */}
        <div
          data-animate="up"
          className="mb-12 flex justify-center gap-8 border-b border-white/5"
        >
          <button
            onClick={() => setActiveTab("explore")}
            className={`pb-4 text-sm font-medium tracking-widest uppercase transition-colors ${
              activeTab === "explore"
                ? "border-gold-500 border-b-2 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Eksplorasi
          </button>
          <button
            onClick={() => setActiveTab("submit")}
            className={`pb-4 text-sm font-medium tracking-widest uppercase transition-colors ${
              activeTab === "submit"
                ? "border-gold-500 border-b-2 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Submit Karya
          </button>
        </div>

        {activeTab === "explore" ? (
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
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="focus:border-gold-500/80 appearance-none border border-white/10 bg-black/40 px-4 py-2.5 pr-8 text-xs text-neutral-300 transition-colors focus:outline-none"
                  style={ACTION_RADIUS}
                >
                  <option value="all">Semua Genre</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                {/* Platform Filter */}
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="focus:border-gold-500/80 appearance-none border border-white/10 bg-black/40 px-4 py-2.5 pr-8 text-xs text-neutral-300 transition-colors focus:outline-none"
                  style={ACTION_RADIUS}
                >
                  <option value="all">Semua Platform</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
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
                        Oleh {entry.creator}
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
        ) : (
          <div
            data-animate="up"
            className="mx-auto max-w-3xl border border-white/5 bg-[#111]/50 p-8 md:p-12"
          >
            {isDone ? (
              <div className="py-12 text-center">
                <div className="bg-gold-500/10 text-gold-500 mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full">
                  <IconMusic className="h-10 w-10" />
                </div>
                <h2 className="mb-4 font-serif text-3xl text-white">
                  Terima{" "}
                  <span className="text-gold-500/80 font-light italic">
                    Kasih!
                  </span>
                </h2>
                <p className="mx-auto max-w-md leading-relaxed font-light text-neutral-400">
                  Karyamu telah masuk ke antrean verifikasi Admin. Karyamu akan
                  muncul di halaman ini setelah disetujui.
                </p>
                <button
                  onClick={() => {
                    setIsDone(false);
                    setActiveTab("explore");
                  }}
                  className="border-gold-500/30 hover:border-gold-300/60 hover:bg-gold-500/10 mt-12 inline-flex items-center justify-center border bg-transparent px-8 py-3 text-sm font-medium text-white transition-colors"
                  style={ACTION_RADIUS}
                >
                  Kembali ke Eksplorasi
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-3">
                  <h2 className="font-serif text-3xl text-white">
                    Submit{" "}
                    <span className="text-gold-500/80 font-light italic">
                      Karya
                    </span>
                  </h2>
                  <p className="text-sm font-light text-neutral-400">
                    Lengkapi data di bawah ini untuk menampilkan karyamu.
                  </p>
                </div>

                <div className="grid gap-10 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
                      Judul Karya / Tayangan
                    </label>
                    <input
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="focus:border-gold-500 focus:ring-gold-500 w-full border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 placeholder-neutral-500 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none"
                      style={ACTION_RADIUS}
                      placeholder="Contoh: Recital Piano 2024"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
                      Pencipta / Penampil
                    </label>
                    <input
                      required
                      value={formData.creator}
                      onChange={(e) =>
                        setFormData({ ...formData, creator: e.target.value })
                      }
                      className="focus:border-gold-500 focus:ring-gold-500 w-full border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 placeholder-neutral-500 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none"
                      style={ACTION_RADIUS}
                      placeholder="Nama mahasiswa atau grup"
                    />
                  </div>
                </div>

                <div className="grid gap-10 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
                      NIM Penanggung Jawab
                    </label>
                    <input
                      required
                      value={formData.nim}
                      onChange={(e) =>
                        setFormData({ ...formData, nim: e.target.value })
                      }
                      className="focus:border-gold-500 focus:ring-gold-500 w-full border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 placeholder-neutral-500 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none"
                      style={ACTION_RADIUS}
                      placeholder="Verifikasi mahasiswa (NIM Angka)"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
                      Platform Utama
                    </label>
                    <div className="relative">
                      <select
                        value={formData.platform}
                        onChange={(e) =>
                          setFormData({ ...formData, platform: e.target.value })
                        }
                        className="focus:border-gold-500 focus:ring-gold-500 w-full appearance-none border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none"
                        style={ACTION_RADIUS}
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p} className="bg-[#111]">
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
                    Genre / Jenis Karya
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((g) => {
                      const isSelected = formData.genres.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? formData.genres.filter((i) => i !== g)
                              : [...formData.genres, g];
                            setFormData({ ...formData, genres: next });
                          }}
                          className={`border px-4 py-2 text-[10px] font-medium tracking-wider uppercase transition-all ${
                            isSelected
                              ? "border-gold-500 bg-gold-500/10 text-gold-400"
                              : "border-white/5 bg-white/5 text-neutral-500 hover:border-white/20 hover:text-neutral-300"
                          }`}
                          style={ACTION_RADIUS}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
                    Link Embed Utama (Full URL)
                  </label>
                  <input
                    required
                    value={formData.embedLink}
                    onChange={(e) =>
                      setFormData({ ...formData, embedLink: e.target.value })
                    }
                    className="focus:border-gold-500 focus:ring-gold-500 w-full border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 placeholder-neutral-500 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none"
                    style={ACTION_RADIUS}
                    placeholder="https://www.youtube.com/watch?v=... atau https://open.spotify.com/track/..."
                  />
                  <p className="text-xs font-light text-neutral-500">
                    Gunakan URL lengkap dari YouTube, Spotify, SoundCloud, atau
                    Apple Music.
                  </p>
                </div>

                <div className="pt-6">
                  {error && (
                    <div className="mb-6 border border-red-500/20 bg-red-500/10 p-4 text-sm font-light text-red-400">
                      {error}
                    </div>
                  )}

                  <button
                    disabled={isSubmitting}
                    className="border-gold-500/30 hover:border-gold-300/60 hover:bg-gold-500/10 group inline-flex w-full items-center justify-center gap-3 border bg-transparent py-4 text-sm font-bold tracking-[0.2em] text-white uppercase transition-all disabled:opacity-50"
                    style={ACTION_RADIUS}
                  >
                    {isSubmitting ? (
                      "Mengirim..."
                    ) : (
                      <>
                        <IconSend className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        Submit Karya
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
