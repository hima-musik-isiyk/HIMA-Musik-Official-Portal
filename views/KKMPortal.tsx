"use client";
import Link from "next/link";

import type { KKMGroup } from "@/lib/kkm-data";
import { SEKRETARIAT_FOOTER_COPY } from "@/lib/site-copy";
import useViewEntrance from "@/lib/useViewEntrance";

/* ------------------------------------------------------------------ */
/*  KKM Card                                                           */
/* ------------------------------------------------------------------ */

type SocialMeta = {
  href: string;
  label: string;
  platform: "instagram" | "tiktok" | "link";
};

function getHostname(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function getPathLabel(link: string): string {
  try {
    const pathname = new URL(link).pathname.split("/").filter(Boolean)[0];
    return pathname ? `@${pathname}` : link;
  } catch {
    return link;
  }
}

function getSocialMeta(link: string): SocialMeta {
  const hostname = getHostname(link);

  if (hostname.includes("instagram.com")) {
    return {
      href: link,
      label: getPathLabel(link),
      platform: "instagram",
    };
  }

  if (hostname.includes("tiktok.com")) {
    return {
      href: link,
      label: getPathLabel(link),
      platform: "tiktok",
    };
  }

  return {
    href: link,
    label: hostname || "External Link",
    platform: "link",
  };
}

function SocialIcon({ platform }: { platform: SocialMeta["platform"] }) {
  if (platform === "instagram") {
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  }

  if (platform === "tiktok") {
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.6 5.82A4.83 4.83 0 0 0 19.43 7v3.12a7.94 7.94 0 0 1-2.83-.52v6.18a5.78 5.78 0 1 1-5.78-5.78c.2 0 .39.01.58.03v3.2a2.6 2.6 0 1 0 2.02 2.55V2h3.18c.03 1.42.58 2.78 1.6 3.82Z" />
      </svg>
    );
  }

  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 5h5v5M10 14 19 5M19 13v5H5V5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KKMCard({ group }: { group: KKMGroup }) {
  return (
    <div
      className="group relative flex flex-col border border-white/5 p-7 transition-colors duration-500 hover:bg-stone-900/10"
      data-animate="up"
      data-animate-duration="0.82"
    >
      <Link
        href={`/kkm/${group.slug}`}
        aria-label={`Buka ${group.name}`}
        className="absolute inset-0 z-0"
      />

      <div className="relative z-10 mb-6">
        <h2 className="group-hover:text-gold-400 font-serif text-xl text-white transition-colors md:text-2xl">
          {group.name}
        </h2>
      </div>

      {group.tagline && (
        <p className="text-gold-500/80 relative z-10 mb-4 text-xs font-medium tracking-wide italic">
          &ldquo;{group.tagline}&rdquo;
        </p>
      )}

      {/* Description */}
      <p className="relative z-10 mb-8 flex-1 text-[0.8125rem] leading-relaxed text-stone-500 transition-colors group-hover:text-stone-400">
        {group.description}
      </p>

      {/* Footer: Social + Established */}
      <div className="relative z-10 mt-auto border-t border-white/5 pt-5">
        {group.socialLinks.length > 0 && (
          <div className="space-y-2">
            {group.socialLinks.map((link) => {
              const social = getSocialMeta(link);

              return (
                <a
                  key={link}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/social relative z-20 flex items-center gap-2 text-xs text-stone-500 transition-colors hover:text-white"
                >
                  <span className="text-gold-500/80 group-hover/social:text-gold-400 transition-colors">
                    <SocialIcon platform={social.platform} />
                  </span>
                  <span className="group-hover/social:text-stone-300">
                    {social.label}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main View                                                          */
/* ------------------------------------------------------------------ */

export default function KKMPortalView({ groups }: { groups: KKMGroup[] }) {
  const scopeRef = useViewEntrance("/kkm");

  return (
    <div
      ref={scopeRef}
      className="relative flex-1 px-6 pt-16 pb-24 md:px-10 lg:px-16"
    >
      {/* Hero Header */}
      <div className="mb-16 max-w-4xl">
        <div data-animate="fade" className="mb-4 flex items-center gap-4">
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
          <span className="text-[0.65rem] font-medium tracking-[0.4em] text-stone-600 uppercase">
            Official Portal
          </span>
        </div>
        <h1
          data-animate="up"
          className="font-serif text-5xl leading-tight font-normal text-white md:text-7xl"
        >
          KKM{" "}
          <span className="font-light text-stone-500 italic">HIMA MUSIK</span>
        </h1>
        <p
          data-animate="up"
          data-animate-delay="0.08"
          className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-400"
        >
          Delapan komunitas kreatif di bawah naungan HIMA MUSIK ISI Yogyakarta.
          Temukan keluarga bermusikmu, kembangkan potensi, dan ciptakan karya
          bersama.
        </p>
      </div>

      {/* KKM Grid */}
      <div
        data-animate-stagger="0.1"
        className="mb-24 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {groups.map((group) => (
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
          {SEKRETARIAT_FOOTER_COPY}
        </p>
      </div>
    </div>
  );
}
