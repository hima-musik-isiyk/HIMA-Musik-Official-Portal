"use client";

import gsap from "gsap";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

import SelectionTimelineCalendar from "@/components/SelectionTimelineCalendar";
import {
  type Division,
  divisions,
  RECRUITMENT_PERIOD,
  RECRUITMENT_TITLE,
} from "@/lib/pendaftaran-data";

const bphMembers = [
  { role: "Ketua Himpunan", name: "Vincent Nuridzati Adittama" },
  { role: "Wakil Ketua", name: "Nadia Fibriani" },
  { role: "Sekretaris", name: "Nuzulul Dian Maulida" },
  { role: "Bendahara", name: "Elizabeth Ardhayu Maheswari" },
];

const openDivisions = [
  { name: "Humas & Kemitraan", slots: 1, angkatan: "2023–2025" },
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
          <p className="text-gold-500/80 text-sm font-medium">
            {division.focus}
          </p>
        </div>
        <span
          className={`ml-4 shrink-0 text-sm text-neutral-500 transition-transform duration-300 ${
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
              <h4 className="mb-3 text-sm font-medium text-neutral-300">
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
              <h4 className="mb-3 text-sm font-medium text-neutral-300">
                Skill &amp; Komitmen
              </h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {division.skills.map((skill) => (
                    <span
                      key={skill}
                      className="border-gold-500/30 bg-gold-500/5 text-gold-300 border px-3 py-1 text-sm"
                      style={{ borderRadius: "var(--radius-action)" }}
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
    <div className="relative min-h-screen overflow-x-hidden px-6 pt-40 pb-32">
      <div className="pointer-events-none absolute inset-0 w-full bg-[radial-gradient(circle_at_top_left,rgba(212,166,77,0.03)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="mb-24">
          <div className="mb-8 flex items-center gap-4">
            <span
              className="bg-gold-500/40 block h-px w-8 md:w-12"
              aria-hidden="true"
            />
            <p className="text-gold-500 text-sm font-medium">
              Open Recruitment — {RECRUITMENT_TITLE}
            </p>
          </div>

          <h1 className="mb-4 font-serif text-5xl tracking-tight text-white md:text-7xl">
            Pendaftaran{" "}
            <span className="text-gold-500/80 font-light italic">Pengurus</span>{" "}
            <span className="text-3xl font-light text-neutral-600 md:text-4xl">
              / {RECRUITMENT_TITLE}
            </span>
          </h1>

          <p className="mb-6 max-w-xl text-base leading-relaxed text-neutral-400">
            Mari wujudkan visi bersama. Jadilah bagian dari pengurus HIMA Musik
            2026.
          </p>

          <div
            className="inline-block border border-white/10 px-5 py-2"
            style={{ borderRadius: "var(--radius-action)" }}
          >
            <p className="text-sm text-neutral-400">
              Periode:{" "}
              <span className="text-gold-300">{RECRUITMENT_PERIOD}</span>
            </p>
          </div>
        </section>

        {/* ── Struktur BPH ───────────────────────────────────── */}
        <section className="mb-24">
          <div className="mb-12 flex items-center gap-4">
            <span
              className="bg-gold-500/40 block h-px w-8 md:w-12"
              aria-hidden="true"
            />
            <p className="text-gold-500 text-sm font-medium">
              Struktur Kabinet 2026
            </p>
          </div>

          {/* Org‑chart tree */}
          <div className="flex flex-col items-center">
            {/* Ketua */}
            <div className="w-full max-w-sm border border-white/[0.08] bg-white/[0.03] px-8 py-6 text-center">
              <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                {bphMembers[0].role}
              </p>
              <p className="font-serif text-lg text-white">
                {bphMembers[0].name}
              </p>
            </div>

            <div className="h-8 w-px bg-white/15" />

            {/* Wakil */}
            <div className="w-full max-w-sm border border-white/[0.08] bg-white/[0.03] px-8 py-6 text-center">
              <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                {bphMembers[1].role}
              </p>
              <p className="font-serif text-lg text-white">
                {bphMembers[1].name}
              </p>
            </div>

            {/* Connector down to branch */}
            <div className="h-8 w-px bg-white/15" />

            {/* T‑branch: Sekretaris & Bendahara */}
            <div className="relative w-full max-w-2xl" ref={branchContainerRef}>
              {/* Horizontal bar spanning exact column centres */}
              <div
                className="absolute top-0 h-px bg-white/15"
                style={{
                  left: `${branchConnector.left}px`,
                  width: `${branchConnector.width}px`,
                }}
              />

              <div className="flex gap-4 pt-px md:gap-8">
                {/* ── Sekretaris → Co‑Sekretaris ── */}
                <div
                  className="flex flex-1 flex-col items-center"
                  ref={sekretarisBranchRef}
                >
                  <div className="h-8 w-px bg-white/15" />
                  <div className="flex w-full flex-1 flex-col justify-center border border-white/[0.08] bg-white/[0.03] px-4 py-5 text-center md:min-h-[100px] md:px-6 md:py-6">
                    <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                      {bphMembers[2].role}
                    </p>
                    <p className="font-serif text-sm leading-snug text-white md:text-base">
                      {bphMembers[2].name}
                    </p>
                  </div>

                  <div className="border-gold-500/35 h-6 w-px border-l border-dashed" />
                  <div className="border-gold-500/20 bg-gold-500/[0.05] flex min-h-[110px] w-full flex-1 flex-col justify-center border px-4 py-5 text-center md:px-6 md:py-6">
                    <p className="text-gold-500/80 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                      Co-Sekretaris
                    </p>
                    <p className="text-gold-200 font-serif text-sm md:text-base">
                      1 posisi terbuka
                    </p>
                    <p className="mt-1.5 text-xs text-neutral-500">
                      Angkatan 2024–2025
                    </p>
                  </div>
                </div>

                {/* ── Bendahara → Co‑Bendahara ── */}
                <div
                  className="flex flex-1 flex-col items-center"
                  ref={bendaharaBranchRef}
                >
                  <div className="h-8 w-px bg-white/15" />
                  <div className="flex w-full flex-1 flex-col justify-center border border-white/[0.08] bg-white/[0.03] px-4 py-5 text-center md:min-h-[100px] md:px-6 md:py-6">
                    <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                      {bphMembers[3].role}
                    </p>
                    <p className="font-serif text-sm leading-snug text-white md:text-base">
                      {bphMembers[3].name}
                    </p>
                  </div>

                  <div className="border-gold-500/35 h-6 w-px border-l border-dashed" />
                  <div className="border-gold-500/20 bg-gold-500/[0.05] flex min-h-[110px] w-full flex-1 flex-col justify-center border px-4 py-5 text-center md:px-6 md:py-6">
                    <p className="text-gold-500/80 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                      Co-Bendahara
                    </p>
                    <p className="text-gold-200 font-serif text-sm md:text-base">
                      1 posisi terbuka
                    </p>
                    <p className="mt-1.5 text-xs text-neutral-500">
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
              <span
                className="bg-gold-500/40 block h-px w-8 md:w-12"
                aria-hidden="true"
              />
              <p className="text-gold-500 text-sm font-medium">
                Divisi Terbuka
              </p>
              <div className="bg-gold-500/10 h-px flex-1" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {openDivisions.map((division) => (
                <div
                  key={division.name}
                  className="border-gold-500/20 bg-gold-500/[0.05] border p-6 text-center"
                >
                  <p className="text-gold-500/80 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                    Divisi
                  </p>
                  <p className="text-gold-200 mb-3 font-serif text-base">
                    {division.name}
                  </p>
                  <p className="text-gold-200/60 text-sm">
                    {division.slots} posisi terbuka
                  </p>
                  <p className="mt-1.5 text-xs text-neutral-500">
                    Angkatan {division.angkatan}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-neutral-500">
            <span className="flex items-center gap-2.5">
              <span className="inline-block h-3 w-3 border border-white/[0.08] bg-white/[0.03]" />
              Posisi terisi
            </span>
            <span className="flex items-center gap-2.5">
              <span className="border-gold-500/20 bg-gold-500/[0.05] inline-block h-3 w-3 border" />
              Posisi terbuka
            </span>
            <span className="flex items-center gap-2.5">
              <span className="border-gold-500/35 inline-block h-0 w-4 border-t border-dashed" />
              Jalur rekrutmen
            </span>
          </div>
        </section>

        {/* ── Panduan Divisi ─────────────────────────────────── */}
        <section className="mb-24">
          <div className="mb-12 flex items-center gap-4">
            <span
              className="bg-gold-500/40 block h-px w-8 md:w-12"
              aria-hidden="true"
            />
            <p className="text-gold-500 text-sm font-medium">Panduan Divisi</p>
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

        {/* ── Mindset & Persiapan ───────────────────────────── */}
        <section className="mb-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-8 flex items-center gap-4">
                <span
                  className="bg-gold-500/40 block h-px w-8 md:w-12"
                  aria-hidden="true"
                />
                <p className="text-gold-500 text-sm font-medium">
                  What to Prepare
                </p>
              </div>
              <h2 className="mb-6 font-serif text-3xl text-white md:text-4xl">
                Mindset & <span className="italic">Persiapan</span>
              </h2>
              <p className="mb-8 leading-relaxed text-neutral-400">
                Kami mencari individu yang tidak hanya memiliki skill teknis,
                tetapi juga integritas, semangat kolaborasi, dan kecintaan pada
                ekosistem musik kampus.
              </p>
              <div className="space-y-6">
                {[
                  {
                    label: "Professionalism",
                    text: "Disiplin dalam waktu dan komunikasi.",
                  },
                  {
                    label: "Commitment",
                    text: "Siap berkontribusi aktif selama satu periode.",
                  },
                  {
                    label: "Growth Mindset",
                    text: "Terbuka terhadap feedback dan pembelajaran baru.",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="bg-gold-500/10 border-gold-500/20 text-gold-500 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px]">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        {item.label}
                      </h4>
                      <p className="text-xs text-neutral-500">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-gold-500/10 bg-gold-500/[0.02] mt-8 border p-8 md:p-10 lg:mt-0">
              <div className="mb-6 flex h-10 w-10 items-center justify-center bg-white/5">
                <span className="text-gold-500 text-lg">✦</span>
              </div>
              <p className="text-gold-200/90 mb-4 text-sm font-semibold tracking-wide uppercase">
                HR Professional Tip
              </p>
              <p className="mb-6 text-sm leading-relaxed text-neutral-400 italic">
                &quot;Saat tahap wawancara, jangan hanya menceritakan apa yang
                bisa kamu lakukan. Ceritakan bagaimana kamu akan menggunakan
                skill tersebut untuk memberikan dampak nyata bagi program kerja
                HIMA.&quot;
              </p>
              <div className="h-px w-full bg-white/5" />
              <p className="mt-6 text-xs leading-relaxed text-neutral-500">
                Pastikan portofolio (khusus PDD & Event) sudah dalam format PDF
                yang rapi atau link folder yang bisa diakses publik.
              </p>
            </div>
          </div>
        </section>

        {/* ── Timeline Seleksi ───────────────────────────────── */}
        <section className="mb-24">
          <div className="mb-12 flex items-center gap-4">
            <span
              className="bg-gold-500/40 block h-px w-8 md:w-12"
              aria-hidden="true"
            />
            <p className="text-gold-500 text-sm font-medium">
              Timeline Seleksi
            </p>
          </div>

          <div className="mt-8">
            <SelectionTimelineCalendar />
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="border-t border-white/5 py-16 text-center">
          <p className="mb-8 text-sm text-neutral-500">Siap bergabung?</p>
          <Link href="/pendaftaran/form" className="btn-primary inline-flex">
            Isi Formulir Pendaftaran
          </Link>
        </section>
      </div>
    </div>
  );
};

export default PendaftaranLanding;
