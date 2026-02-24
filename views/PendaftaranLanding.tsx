"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  type Division,
  divisions,
  RECRUITMENT_PERIOD,
  SELECTION_TIMELINE,
} from "@/lib/pendaftaran-data";

const bphMembers = [
  { role: "Ketua Himpunan", name: "Vincent Nuridzati Adittama" },
  { role: "Wakil Ketua", name: "Nadia Fibriani" },
  { role: "Sekretaris", name: "Nuzulul Dian Maulida" },
  { role: "Bendahara", name: "Elizabeth Ardhayu Maheswari" },
];

const openDivisions = [
  { name: "Humas & Kemitraan", slots: 2, angkatan: "2023–2025" },
  { name: "Program & Event", slots: 2, angkatan: "2023–2025" },
  {
    name: "Publikasi, Desain & Dokumentasi",
    slots: 3,
    angkatan: "2023–2025",
  },
];

const DivisionAccordionItem: React.FC<{
  division: Division;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ division, isOpen, onToggle }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    gsap.killTweensOf(content);

    if (isOpen) {
      gsap.to(content, {
        height: "auto",
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
      });
      return;
    }

    gsap.to(content, {
      height: 0,
      opacity: 0,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [isOpen]);

  return (
    <div className="border border-white/5 bg-white/2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`division-panel-${division.id}`}
        className="w-full flex items-center justify-between cursor-pointer p-6 md:p-8 select-none text-left"
      >
        <div>
          <h3 className="font-serif text-xl md:text-2xl text-white mb-1">
            {division.name}
          </h3>
          <p className="text-xs uppercase tracking-[0.25em] text-gold-500/70">
            {division.focus}
          </p>
        </div>
        <span
          className={`text-xs text-neutral-500 transition-transform duration-300 shrink-0 ml-4 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      <div
        ref={contentRef}
        id={`division-panel-${division.id}`}
        className="h-0 overflow-hidden opacity-0"
      >
        <div className="px-6 md:px-8 pb-6 md:pb-8 border-t border-white/5">
          <p className="text-sm text-neutral-400 leading-relaxed mt-6 mb-6">
            {division.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 font-medium">
                Tugas Utama
              </h4>
              <ul className="text-sm text-neutral-300 space-y-2">
                {division.tasks.map((task) => (
                  <li key={task} className="flex gap-3">
                    <span className="text-gold-500 shrink-0">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 font-medium">
                Skill &amp; Komitmen
              </h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {division.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs border border-gold-500/30 bg-gold-500/5 px-3 py-1 text-gold-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-neutral-300">
                  {division.commitment}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PendaftaranLanding: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const branchContainerRef = useRef<HTMLDivElement>(null);
  const sekretarisBranchRef = useRef<HTMLDivElement>(null);
  const bendaharaBranchRef = useRef<HTMLDivElement>(null);
  const [branchConnector, setBranchConnector] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateBranchConnector = () => {
      const container = branchContainerRef.current;
      const sekretaris = sekretarisBranchRef.current;
      const bendahara = bendaharaBranchRef.current;

      if (!container || !sekretaris || !bendahara) return;

      const containerRect = container.getBoundingClientRect();
      const sekretarisRect = sekretaris.getBoundingClientRect();
      const bendaharaRect = bendahara.getBoundingClientRect();

      const sekretarisCenter =
        sekretarisRect.left - containerRect.left + sekretarisRect.width / 2;
      const bendaharaCenter =
        bendaharaRect.left - containerRect.left + bendaharaRect.width / 2;

      const left = Math.min(sekretarisCenter, bendaharaCenter);
      const width = Math.abs(bendaharaCenter - sekretarisCenter);

      setBranchConnector({ left, width });
    };

    const frameId = window.requestAnimationFrame(updateBranchConnector);
    window.addEventListener("resize", updateBranchConnector);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateBranchConnector);
    };
  }, []);

  const toggleDivision = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="pt-40 pb-32 px-6 min-h-screen relative">
      <div className="absolute top-0 left-0 w-full h-screen bg-[radial-gradient(circle_at_top_left,rgba(212,166,77,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px w-8 bg-gold-500/50" />
            <p className="text-xs uppercase tracking-[0.4em] text-gold-500 font-medium">
              Open Recruitment
            </p>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl text-white tracking-tight mb-4">
            Pendaftaran{" "}
            <span className="italic text-gold-500/80 font-light">Pengurus</span>
          </h1>

          <p className="text-neutral-400 text-sm max-w-xl leading-relaxed mb-6">
            Bergabung dalam kepengurusan HIMA Musik 2026. Lihat struktur
            organisasi, kenali setiap divisi, dan daftarkan dirimu.
          </p>

          <div className="inline-block border border-white/10 px-5 py-2">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
              Periode:{" "}
              <span className="text-gold-300">{RECRUITMENT_PERIOD}</span>
            </p>
          </div>
        </section>

        {/* ── Struktur BPH ───────────────────────────────────── */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px w-8 bg-gold-500/50" />
            <p className="text-xs uppercase tracking-[0.4em] text-gold-500 font-medium">
              Struktur Kabinet 2026
            </p>
          </div>

          {/* Org‑chart tree */}
          <div className="flex flex-col items-center">
            {/* Ketua */}
            <div className="border border-white/10 bg-white/2 py-5 px-8 text-center w-full max-w-xs">
              <p className="text-[0.6rem] uppercase tracking-[0.35em] text-neutral-500 mb-1">
                {bphMembers[0].role}
              </p>
              <p className="font-serif text-lg text-neutral-200">
                {bphMembers[0].name}
              </p>
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Wakil */}
            <div className="border border-white/10 bg-white/2 py-5 px-8 text-center w-full max-w-xs">
              <p className="text-[0.6rem] uppercase tracking-[0.35em] text-neutral-500 mb-1">
                {bphMembers[1].role}
              </p>
              <p className="font-serif text-lg text-neutral-200">
                {bphMembers[1].name}
              </p>
            </div>

            {/* Connector down to branch */}
            <div className="w-px h-8 bg-white/10" />

            {/* T‑branch: Sekretaris & Bendahara */}
            <div className="w-full max-w-2xl relative" ref={branchContainerRef}>
              {/* Horizontal bar spanning exact column centres */}
              <div
                className="absolute top-0 h-px bg-white/10"
                style={{
                  left: `${branchConnector.left}px`,
                  width: `${branchConnector.width}px`,
                }}
              />

              <div className="flex gap-3 md:gap-6 pt-px">
                {/* ── Sekretaris → Co‑Sekretaris ── */}
                <div
                  className="flex-1 flex flex-col items-center"
                  ref={sekretarisBranchRef}
                >
                  <div className="w-px h-8 bg-white/10" />
                  <div className="border border-white/10 bg-white/2 py-3 px-3 md:py-4 md:px-6 text-center w-full max-w-60 min-h-30 md:min-h-32 flex flex-col justify-center">
                    <p className="text-[0.6rem] uppercase tracking-[0.35em] text-neutral-500 mb-1">
                      {bphMembers[2].role}
                    </p>
                    <p className="font-serif text-base text-neutral-200 leading-snug">
                      {bphMembers[2].name}
                    </p>
                  </div>

                  <div className="h-6 w-0 border-l border-dashed border-gold-500/40" />
                  <div className="border border-gold-500/30 bg-gold-500/4 py-3 px-3 md:py-4 md:px-6 text-center w-full max-w-60 min-h-30 md:min-h-32 flex flex-col justify-center">
                    <p className="text-[0.6rem] uppercase tracking-[0.35em] text-gold-500 mb-1">
                      Co-Sekretaris
                    </p>
                    <p className="text-xs text-gold-300/60">1 posisi terbuka</p>
                    <p className="text-[0.55rem] text-neutral-500 mt-1">
                      Angkatan 2024–2025
                    </p>
                  </div>
                </div>

                {/* ── Bendahara → Co‑Bendahara ── */}
                <div
                  className="flex-1 flex flex-col items-center"
                  ref={bendaharaBranchRef}
                >
                  <div className="w-px h-8 bg-white/10" />
                  <div className="border border-white/10 bg-white/2 py-3 px-3 md:py-4 md:px-6 text-center w-full max-w-60 min-h-30 md:min-h-32 flex flex-col justify-center">
                    <p className="text-[0.6rem] uppercase tracking-[0.35em] text-neutral-500 mb-1">
                      {bphMembers[3].role}
                    </p>
                    <p className="font-serif text-base text-neutral-200 leading-snug">
                      {bphMembers[3].name}
                    </p>
                  </div>

                  <div className="h-6 w-0 border-l border-dashed border-gold-500/40" />
                  <div className="border border-gold-500/30 bg-gold-500/4 py-3 px-3 md:py-4 md:px-6 text-center w-full max-w-60 min-h-30 md:min-h-32 flex flex-col justify-center">
                    <p className="text-[0.6rem] uppercase tracking-[0.35em] text-gold-500 mb-1">
                      Co-Bendahara
                    </p>
                    <p className="text-xs text-gold-300/60">1 posisi terbuka</p>
                    <p className="text-[0.55rem] text-neutral-500 mt-1">
                      Angkatan 2024–2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Open Divisions */}
          <div className="mt-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-6 bg-gold-500/30" />
              <p className="text-xs uppercase tracking-[0.3em] text-gold-400/80 font-medium">
                Divisi Terbuka
              </p>
              <div className="h-px flex-1 bg-gold-500/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {openDivisions.map((division) => (
                <div
                  key={division.name}
                  className="border border-gold-500/30 bg-gold-500/4 p-6 text-center"
                >
                  <p className="font-serif text-lg text-gold-200 mb-2">
                    {division.name}
                  </p>
                  <p className="text-xs text-gold-300/60">
                    {division.slots} posisi terbuka
                  </p>
                  <p className="text-[0.55rem] text-neutral-500 mt-1">
                    Angkatan {division.angkatan}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-neutral-500">
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border border-white/10 bg-white/2" />
              Posisi terisi
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border border-gold-500/30 bg-gold-500/4" />
              Posisi terbuka
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-0 border-t border-dashed border-gold-500/40" />
              Jalur rekrutmen
            </span>
          </div>
        </section>

        {/* ── Panduan Divisi ─────────────────────────────────── */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px w-8 bg-gold-500/50" />
            <p className="text-xs uppercase tracking-[0.4em] text-gold-500 font-medium">
              Panduan Divisi
            </p>
          </div>

          <div className="space-y-4">
            {divisions.map((division) => (
              <DivisionAccordionItem
                key={division.id}
                division={division}
                isOpen={Boolean(openSections[division.id])}
                onToggle={() => toggleDivision(division.id)}
              />
            ))}
          </div>
        </section>

        {/* ── Timeline Seleksi ───────────────────────────────── */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px w-8 bg-gold-500/50" />
            <p className="text-xs uppercase tracking-[0.4em] text-gold-500 font-medium">
              Timeline Seleksi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SELECTION_TIMELINE.map((item, index) => (
              <div
                key={item.title}
                className="border border-white/5 bg-[#0f0f0f] p-6 flex flex-col gap-3 relative"
              >
                <span className="text-[0.6rem] uppercase tracking-[0.3em] text-neutral-600 absolute top-4 right-4">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-xl text-white">{item.title}</h3>
                <span className="text-xs uppercase tracking-[0.3em] text-gold-300/80">
                  {item.date}
                </span>
                <p className="text-sm text-neutral-400 leading-relaxed font-light">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="text-center py-16 border-t border-white/5">
          <p className="text-neutral-500 text-sm mb-8 uppercase tracking-[0.2em]">
            Siap bergabung?
          </p>
          <Link href="/pendaftaran/form" className="btn-primary inline-flex">
            <span className="btn-primary-label">Isi Formulir Pendaftaran</span>
            <div className="btn-primary-overlay" />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default PendaftaranLanding;
