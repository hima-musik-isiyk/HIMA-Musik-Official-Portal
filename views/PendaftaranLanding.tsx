"use client";

import gsap from "gsap";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

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
        className="flex w-full cursor-pointer items-center justify-between p-6 text-left select-none md:p-8"
      >
        <div>
          <h3 className="mb-1 font-serif text-xl text-white md:text-2xl">
            {division.name}
          </h3>
          <p className="text-gold-500/70 text-xs tracking-[0.25em] uppercase">
            {division.focus}
          </p>
        </div>
        <span
          className={`ml-4 shrink-0 text-xs text-neutral-500 transition-transform duration-300 ${
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
        <div className="border-t border-white/5 px-6 pb-6 md:px-8 md:pb-8">
          <p className="mt-6 mb-6 text-sm leading-relaxed text-neutral-400">
            {division.summary}
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h4 className="mb-3 text-xs font-medium tracking-[0.3em] text-neutral-400 uppercase">
                Tugas Utama
              </h4>
              <ul className="space-y-2 text-sm text-neutral-300">
                {division.tasks.map((task) => (
                  <li key={task} className="flex gap-3">
                    <span className="text-gold-500 shrink-0">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-medium tracking-[0.3em] text-neutral-400 uppercase">
                Skill &amp; Komitmen
              </h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {division.skills.map((skill) => (
                    <span
                      key={skill}
                      className="border-gold-500/30 bg-gold-500/5 text-gold-300 border px-3 py-1 text-xs"
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
    <div className="relative min-h-screen px-6 pt-40 pb-32">
      <div className="pointer-events-none absolute top-0 left-0 h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(212,166,77,0.03)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="mb-24">
          <div className="mb-8 flex items-center gap-4">
            <div className="bg-gold-500/50 h-px w-8" />
            <p className="text-gold-500 text-xs font-medium tracking-[0.4em] uppercase">
              Open Recruitment
            </p>
          </div>

          <h1 className="mb-4 font-serif text-5xl tracking-tight text-white md:text-7xl">
            Pendaftaran{" "}
            <span className="text-gold-500/80 font-light italic">Pengurus</span>
          </h1>

          <p className="mb-6 max-w-xl text-sm leading-relaxed text-neutral-400">
            Bergabung dalam kepengurusan HIMA Musik 2026. Lihat struktur
            organisasi, kenali setiap divisi, dan daftarkan dirimu.
          </p>

          <div className="inline-block border border-white/10 px-5 py-2">
            <p className="text-xs tracking-[0.3em] text-neutral-400 uppercase">
              Periode:{" "}
              <span className="text-gold-300">{RECRUITMENT_PERIOD}</span>
            </p>
          </div>
        </section>

        {/* ── Struktur BPH ───────────────────────────────────── */}
        <section className="mb-24">
          <div className="mb-12 flex items-center gap-4">
            <div className="bg-gold-500/50 h-px w-8" />
            <p className="text-gold-500 text-xs font-medium tracking-[0.4em] uppercase">
              Struktur Kabinet 2026
            </p>
          </div>

          {/* Org‑chart tree */}
          <div className="flex flex-col items-center">
            {/* Ketua */}
            <div className="w-full max-w-xs border border-white/10 bg-white/2 px-8 py-5 text-center">
              <p className="mb-1 text-[0.6rem] tracking-[0.35em] text-neutral-500 uppercase">
                {bphMembers[0].role}
              </p>
              <p className="font-serif text-lg text-neutral-200">
                {bphMembers[0].name}
              </p>
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Wakil */}
            <div className="w-full max-w-xs border border-white/10 bg-white/2 px-8 py-5 text-center">
              <p className="mb-1 text-[0.6rem] tracking-[0.35em] text-neutral-500 uppercase">
                {bphMembers[1].role}
              </p>
              <p className="font-serif text-lg text-neutral-200">
                {bphMembers[1].name}
              </p>
            </div>

            {/* Connector down to branch */}
            <div className="h-8 w-px bg-white/10" />

            {/* T‑branch: Sekretaris & Bendahara */}
            <div className="relative w-full max-w-2xl" ref={branchContainerRef}>
              {/* Horizontal bar spanning exact column centres */}
              <div
                className="absolute top-0 h-px bg-white/10"
                style={{
                  left: `${branchConnector.left}px`,
                  width: `${branchConnector.width}px`,
                }}
              />

              <div className="flex gap-3 pt-px md:gap-6">
                {/* ── Sekretaris → Co‑Sekretaris ── */}
                <div
                  className="flex flex-1 flex-col items-center"
                  ref={sekretarisBranchRef}
                >
                  <div className="h-8 w-px bg-white/10" />
                  <div className="flex min-h-30 w-full max-w-60 flex-col justify-center border border-white/10 bg-white/2 px-3 py-3 text-center md:min-h-32 md:px-6 md:py-4">
                    <p className="mb-1 text-[0.6rem] tracking-[0.35em] text-neutral-500 uppercase">
                      {bphMembers[2].role}
                    </p>
                    <p className="font-serif text-base leading-snug text-neutral-200">
                      {bphMembers[2].name}
                    </p>
                  </div>

                  <div className="border-gold-500/40 h-6 w-0 border-l border-dashed" />
                  <div className="border-gold-500/30 bg-gold-500/4 flex min-h-30 w-full max-w-60 flex-col justify-center border px-3 py-3 text-center md:min-h-32 md:px-6 md:py-4">
                    <p className="text-gold-500 mb-1 text-[0.6rem] tracking-[0.35em] uppercase">
                      Co-Sekretaris
                    </p>
                    <p className="text-gold-300/60 text-xs">1 posisi terbuka</p>
                    <p className="mt-1 text-[0.55rem] text-neutral-500">
                      Angkatan 2024–2025
                    </p>
                  </div>
                </div>

                {/* ── Bendahara → Co‑Bendahara ── */}
                <div
                  className="flex flex-1 flex-col items-center"
                  ref={bendaharaBranchRef}
                >
                  <div className="h-8 w-px bg-white/10" />
                  <div className="flex min-h-30 w-full max-w-60 flex-col justify-center border border-white/10 bg-white/2 px-3 py-3 text-center md:min-h-32 md:px-6 md:py-4">
                    <p className="mb-1 text-[0.6rem] tracking-[0.35em] text-neutral-500 uppercase">
                      {bphMembers[3].role}
                    </p>
                    <p className="font-serif text-base leading-snug text-neutral-200">
                      {bphMembers[3].name}
                    </p>
                  </div>

                  <div className="border-gold-500/40 h-6 w-0 border-l border-dashed" />
                  <div className="border-gold-500/30 bg-gold-500/4 flex min-h-30 w-full max-w-60 flex-col justify-center border px-3 py-3 text-center md:min-h-32 md:px-6 md:py-4">
                    <p className="text-gold-500 mb-1 text-[0.6rem] tracking-[0.35em] uppercase">
                      Co-Bendahara
                    </p>
                    <p className="text-gold-300/60 text-xs">1 posisi terbuka</p>
                    <p className="mt-1 text-[0.55rem] text-neutral-500">
                      Angkatan 2024–2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Open Divisions */}
          <div className="mt-16">
            <div className="mb-8 flex items-center gap-4">
              <div className="bg-gold-500/30 h-px w-6" />
              <p className="text-gold-400/80 text-xs font-medium tracking-[0.3em] uppercase">
                Divisi Terbuka
              </p>
              <div className="bg-gold-500/10 h-px flex-1" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {openDivisions.map((division) => (
                <div
                  key={division.name}
                  className="border-gold-500/30 bg-gold-500/4 border p-6 text-center"
                >
                  <p className="text-gold-200 mb-2 font-serif text-lg">
                    {division.name}
                  </p>
                  <p className="text-gold-300/60 text-xs">
                    {division.slots} posisi terbuka
                  </p>
                  <p className="mt-1 text-[0.55rem] text-neutral-500">
                    Angkatan {division.angkatan}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-neutral-500">
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 border border-white/10 bg-white/2" />
              Posisi terisi
            </span>
            <span className="flex items-center gap-2">
              <span className="border-gold-500/30 bg-gold-500/4 inline-block h-3 w-3 border" />
              Posisi terbuka
            </span>
            <span className="flex items-center gap-2">
              <span className="border-gold-500/40 inline-block h-0 w-4 border-t border-dashed" />
              Jalur rekrutmen
            </span>
          </div>
        </section>

        {/* ── Panduan Divisi ─────────────────────────────────── */}
        <section className="mb-24">
          <div className="mb-12 flex items-center gap-4">
            <div className="bg-gold-500/50 h-px w-8" />
            <p className="text-gold-500 text-xs font-medium tracking-[0.4em] uppercase">
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
          <div className="mb-12 flex items-center gap-4">
            <div className="bg-gold-500/50 h-px w-8" />
            <p className="text-gold-500 text-xs font-medium tracking-[0.4em] uppercase">
              Timeline Seleksi
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {SELECTION_TIMELINE.map((item, index) => (
              <div
                key={item.title}
                className="relative flex flex-col gap-3 border border-white/5 bg-[#0f0f0f] p-6"
              >
                <span className="absolute top-4 right-4 text-[0.6rem] tracking-[0.3em] text-neutral-600 uppercase">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-xl text-white">{item.title}</h3>
                <span className="text-gold-300/80 text-xs tracking-[0.3em] uppercase">
                  {item.date}
                </span>
                <p className="text-sm leading-relaxed font-light text-neutral-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="border-t border-white/5 py-16 text-center">
          <p className="mb-8 text-sm tracking-[0.2em] text-neutral-500 uppercase">
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
