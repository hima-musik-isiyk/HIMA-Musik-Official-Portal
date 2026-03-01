"use client";
import { KKM_GROUPS, type KKMGroup } from "@/lib/kkm-data";
import useViewEntrance from "@/lib/useViewEntrance";

/* ------------------------------------------------------------------ */
/*  KKM Card                                                           */
/* ------------------------------------------------------------------ */

function KKMCard({ group }: { group: KKMGroup }) {
  return (
    <div
      className="group relative flex flex-col border border-white/5 p-7 transition-all duration-500 hover:bg-stone-900/10"
      data-animate="up"
    >
      {/* Recruitment badge */}
      {group.recruitmentOpen && (
        <span className="absolute top-5 right-5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[0.6rem] font-medium tracking-wider text-emerald-400 uppercase">
          Open Recruitment
        </span>
      )}

      <div className="mb-6">
        <h2 className="group-hover:text-gold-400 font-serif text-xl text-white transition-colors md:text-2xl">
          {group.name}
        </h2>
      </div>

      {/* Tagline */}
      <p className="text-gold-500/80 mb-4 text-xs font-medium tracking-wide italic">
        &ldquo;{group.tagline}&rdquo;
      </p>

      {/* Description */}
      <p className="mb-8 flex-1 text-[0.8125rem] leading-relaxed text-stone-500 transition-colors group-hover:text-stone-400">
        {group.description}
      </p>

      {/* Footer: Social + Established */}
      <div className="mt-auto flex items-center border-t border-white/5 pt-5">
        {group.instagram && (
          <a
            href={`https://instagram.com/${group.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/ig flex items-center gap-2 text-xs text-stone-500 transition-colors hover:text-white"
          >
            <svg
              className="group-hover/ig:text-gold-400 h-3.5 w-3.5 transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span className="group-hover/ig:text-stone-300">
              @{group.instagram}
            </span>
          </a>
        )}
        {group.established && (
          <span className="ml-auto text-[0.6rem] tracking-wider text-stone-600">
            Est. {group.established}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main View                                                          */
/* ------------------------------------------------------------------ */

export default function KKMPortalView() {
  const scopeRef = useViewEntrance("/kkm");

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
          KKM{" "}
          <span className="font-light text-stone-500 italic">HIMA MUSIK</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-400">
          Delapan komunitas kreatif di bawah naungan HIMA MUSIK ISI Yogyakarta.
          Temukan keluarga bermusikmu, kembangkan potensi, dan ciptakan karya
          bersama.
        </p>
      </div>

      {/* KKM Grid */}
      <div className="mb-24 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {KKM_GROUPS.map((group) => (
          <KKMCard key={group.slug} group={group} />
        ))}
      </div>

      {/* About KKM (from AD/ART) */}
      <div
        data-animate="up"
        className="mx-auto mb-24 max-w-3xl border border-white/5 p-8 md:p-12"
      >
        <div className="mb-6 flex items-center gap-4">
          <span className="bg-gold-500/40 block h-px w-6" aria-hidden="true" />
          <h2 className="font-serif text-2xl text-white">Tentang KKM</h2>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-stone-400">
          <p>
            Berdasarkan{" "}
            <span className="text-gold-400 font-medium">
              AD/ART BAB IX Pasal 26
            </span>
            , Kelompok Kegiatan Mahasiswa (KKM) adalah organisasi di bawah
            naungan HMJ Musik FSP ISI-YK yang menjunjung kegiatan kokurikuler.
          </p>
          <p>
            Setiap KKM memiliki kepengurusan sendiri dan berpartisipasi dalam
            Musyawarah Mahasiswa (MUSMA) sebagai perwakilan struktural. KKM
            menjadi wadah bagi mahasiswa untuk mengembangkan minat spesifik di
            bidang musik, jurnalistik, dan kesenian.
          </p>
        </div>
      </div>

      {/* Footer Accents */}
      <div data-animate="up" className="mt-24 text-center">
        <div className="mb-4 flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-white/5" />
          <div className="bg-gold-500/50 h-1.5 w-1.5 rounded-full" />
          <div className="h-px w-12 bg-white/5" />
        </div>
        <p className="text-[0.6rem] tracking-[0.3em] text-stone-600 uppercase">
          HIMA MUSIK ISI Yogyakarta © 2024-2026
        </p>
      </div>
    </div>
  );
}
