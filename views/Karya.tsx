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

        <div data-animate="up" className="mb-20 text-center">
          <h1 className="mb-6 font-serif text-5xl tracking-tight text-white md:text-7xl">
            Karya{" "}
            <span className="text-gold-500/80 font-light italic">
              Mahasiswa
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-neutral-400">
            Etalase digital karya dan kreativitas mahasiswa Program Studi Musik
            ISI Yogyakarta. Disubmit oleh mahasiswa, dikurasi oleh HIMA.
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
          <div
            data-animate="up"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {entries.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <IconMusic className="mx-auto mb-4 h-12 w-12 text-stone-700" />
                <p className="text-stone-500">
                  Belum ada karya yang ditampilkan.
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="group hover:border-gold-500/30 relative flex flex-col border border-white/5 bg-[#111]/50 p-8 transition-all hover:bg-white/5"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <span className="text-gold-500 text-[10px] font-medium tracking-[0.2em] uppercase">
                      {entry.platform}
                    </span>
                    <a
                      href={entry.embedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-500 transition-colors hover:text-white"
                    >
                      <IconExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <h3 className="mb-2 line-clamp-2 font-serif text-2xl text-white">
                    {entry.title}
                  </h3>
                  <p className="mb-6 text-sm font-light text-neutral-400">
                    {entry.creator}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {entry.genres.map((g) => (
                      <span
                        key={g}
                        className="group-hover:border-gold-500/20 group-hover:text-gold-500/60 border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] font-medium tracking-wider text-neutral-500 uppercase transition-colors"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
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
                      placeholder="Verifikasi mahasiswa"
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
                    Link Embed (Full URL)
                  </label>
                  <input
                    required
                    value={formData.embedLink}
                    onChange={(e) =>
                      setFormData({ ...formData, embedLink: e.target.value })
                    }
                    className="focus:border-gold-500 focus:ring-gold-500 w-full border border-white/10 bg-[#1a1a1a] px-4 py-3 text-base text-neutral-200 placeholder-neutral-500 transition-colors duration-300 focus:bg-[#222] focus:ring-1 focus:outline-none"
                    style={ACTION_RADIUS}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs font-light text-neutral-500">
                    Gunakan URL lengkap dari YouTube, Spotify, atau platform
                    lainnya.
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
