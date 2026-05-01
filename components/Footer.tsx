"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

// divisions data removed from footer since recruitment CTA is hidden
import useViewEntrance from "@/lib/useViewEntrance";
import { flagViewEntranceForNextRoute } from "@/lib/view-entrance";

import LogoHima from "./LogoHima";

/* ─── tiny reusable arrow icon ─── */
const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/* Animated year counter removed (unused) */

/* ─── data ─── */
const NAV_LINKS = [
  { name: "Beranda", href: "/" },
  { name: "Profil", href: "/about" },
  { name: "Kalender Acara", href: "/events" },
  { name: "Galeri Visual", href: "/gallery" },
  { name: "Pusat Administrasi", href: "/sekretariat" },
  { name: "Ruang Advokasi", href: "/aduan" },
  // Open Recruitment intentionally hidden
];

const LEGAL_LINKS = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Data Deletion", href: "/data-deletion" },
  { name: "Terms", href: "/terms-of-service" },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const scopeRef = useViewEntrance(pathname);

  // Don't render footer on sekretariat pages
  if (pathname?.startsWith("/sekretariat")) return null;

  // Helper to only return animation attributes on Home page
  const animAttrs = (variant: string, delay = 0, scroll = true) => {
    if (pathname !== "/") return {};
    return {
      "data-animate": variant,
      ...(delay > 0 ? { "data-animate-delay": delay } : {}),
      ...(scroll ? { "data-animate-scroll": "true" } : {}),
    };
  };

  const markIntentionalRouteAnimation = () => {
    if (typeof window === "undefined") return;
    flagViewEntranceForNextRoute();
  };

  return (
    <footer
      ref={scopeRef}
      className="relative z-2 overflow-hidden border-t border-stone-800/40 bg-stone-950"
    >
      {/* ── ambient background effects ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* warm glow top-left */}
        <div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(212,166,77,0.15) 0%, transparent 70%)",
          }}
        />
        {/* cool glow bottom-right */}
        <div
          className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full opacity-20 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,101,1,0.1) 0%, transparent 70%)",
          }}
        />
        {/* subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ═══════════════════  MAIN CONTENT  ═══════════════════ */}
      <div className="relative px-8 pt-24 pb-0 md:pt-20">
        {/* ── hero brand strip ── */}
        <div
          {...animAttrs("up")}
          className="mx-auto mb-20 flex max-w-7xl flex-col items-center gap-10 text-center md:mb-24 md:flex-row md:gap-16 md:text-left"
        >
          <Link href="/" className="group relative shrink-0">
            {/* pulsing aura behind logo */}
            <div className="bg-gold-500/5 group-hover:bg-gold-500/10 absolute inset-0 -z-1 scale-150 rounded-full blur-3xl transition-all duration-700 group-hover:scale-[1.8]" />
            <LogoHima
              lineColor="white"
              glyphColor="currentColor"
              textColor="white"
              showLines={false}
              showText={false}
              className="group-hover:text-gold-500 h-28 w-auto text-stone-600 transition-all duration-500 md:h-36"
            />
          </Link>

          <div className="flex flex-col gap-5">
            <h2 className="font-serif text-3xl tracking-tight text-white md:text-4xl">
              HIMA{" "}
              <span className="text-gold-500 font-light italic">Musik</span>
            </h2>
            <p className="max-w-lg text-sm leading-[1.8] tracking-wide text-stone-500">
              Wadah kolektif mahasiswa Musik ISI Yogyakarta. Membangun ekosistem
              kreatif yang inklusif, progresif, dan berorientasi pada keunggulan
              artistik.
            </p>
          </div>
        </div>

        {/* ── horizontal accent rule ── */}
        <div className="mx-auto max-w-7xl">
          <div
            {...animAttrs("scale-x", 0)}
            style={{ transformOrigin: "center" }}
            className="via-gold-500/20 h-px bg-linear-to-r from-transparent to-transparent"
          />
        </div>

        {/* ── 3-column grid ── */}
        <div
          data-animate-stagger="0.12"
          {...(pathname === "/" ? { "data-animate-scroll": "true" } : {})}
          className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-16 md:mt-20 md:grid-cols-12 md:gap-8"
        >
          {/* Col 1 — Navigation */}
          <div {...animAttrs("up", 0, false)} className="md:col-span-4">
            <h4 className="mb-8 flex items-center gap-3 text-[0.65rem] font-bold tracking-[0.4em] text-stone-600 uppercase">
              <span className="bg-gold-500/40 inline-block h-px w-6" />
              Navigasi
            </h4>
            <ul className="grid grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={markIntentionalRouteAnimation}
                    className="group hover:border-gold-500/20 flex items-center justify-between border-b border-stone-900/30 py-3.5 transition-colors md:border-0 md:py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="group-hover:bg-gold-500 inline-block h-1 w-1 rounded-full bg-stone-800 transition-all duration-300 group-hover:scale-150" />
                      <span className="text-sm tracking-[0.15em] text-stone-500 uppercase transition-all duration-300 group-hover:tracking-[0.2em] group-hover:text-stone-300">
                        {link.name}
                      </span>
                    </div>
                    <ArrowIcon className="group-hover:text-gold-500 text-stone-800 transition-all duration-300 group-hover:translate-x-1 md:opacity-0 md:group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2 — Kontak */}
          <div {...animAttrs("up", 0, false)} className="md:col-span-4">
            <h4 className="mb-8 flex items-center gap-3 text-[0.65rem] font-bold tracking-[0.4em] text-stone-600 uppercase">
              <span className="bg-gold-500/40 inline-block h-px w-6" />
              Kontak
            </h4>

            <div className="space-y-8">
              {/* Address */}
              <div className="group">
                <span className="mb-2 block text-[10px] font-bold tracking-[0.4em] text-stone-700 uppercase transition-colors duration-300 group-hover:text-stone-500">
                  Studio & Sekretariat
                </span>
                <p className="text-sm leading-relaxed tracking-widest text-stone-500 uppercase">
                  FSP ISI Yogyakarta
                  <br />
                  Gedung Jurasik Lt. 2
                </p>
              </div>

              {/* Email */}
              <div>
                <span className="mb-2 block text-[10px] font-bold tracking-[0.4em] text-stone-700 uppercase">
                  Electronic Mail
                </span>
                <a
                  href="mailto:musikisiyk@gmail.com"
                  className="group hover:text-gold-300 inline-flex items-center gap-3 text-sm tracking-widest text-stone-500 transition-colors"
                >
                  <div className="group-hover:border-gold-500/50 group-hover:bg-gold-500/5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-800/80 transition-all duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <span className="group-hover:border-gold-500/30 border-b border-transparent pb-0.5 transition-all">
                    musikisiyk@gmail.com
                  </span>
                </a>
              </div>

              {/* Instagram */}
              <div>
                <span className="mb-2 block text-[10px] font-bold tracking-[0.4em] text-stone-700 uppercase">
                  Social Media
                </span>
                <a
                  href="https://instagram.com/himamusikisi"
                  target="_blank"
                  rel="noreferrer"
                  className="group hover:text-gold-300 inline-flex items-center gap-3 text-sm tracking-widest text-stone-500 transition-colors"
                >
                  <div className="group-hover:border-gold-500/50 group-hover:bg-gold-500/5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-800/80 transition-all duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </div>
                  <span className="group-hover:border-gold-500/30 border-b border-transparent pb-0.5 transition-all">
                    @himamusikisi
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Col 3 — Identitas / Quick CTA (hidden) */}
          <div
            {...animAttrs("up", 0, false)}
            className="md:col-span-4"
            aria-hidden="true"
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* ═══════════════════  BOTTOM BAR  ═══════════════════ */}
      <div {...animAttrs("up", 0.2)} className="relative mt-20 md:mt-24">
        {/* decorative top border */}
        <div className="mx-auto max-w-7xl px-8">
          <div className="h-px bg-linear-to-r from-transparent via-stone-800/60 to-transparent" />
        </div>

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-8 py-10 md:flex-row md:py-12">
          <p className="text-center text-[0.65rem] tracking-[0.5em] text-stone-700 uppercase md:text-left">
            &copy; {currentYear} HIMA Musik ISI Yogyakarta
          </p>
          <nav
            aria-label="Legal links"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={markIntentionalRouteAnimation}
                className="text-[0.65rem] tracking-[0.22em] text-stone-600 uppercase transition-colors hover:text-stone-300"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <p
            className="text-gold-500 text-[0.65rem] tracking-[0.3em] uppercase"
            title="Nama Kabinet HIMA Musik 2026"
          >
            Kabinet Candenza
          </p>
        </div>

        {/* ── large watermark text ── */}
        <div
          className="pointer-events-none relative overflow-hidden"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center justify-center bg-linear-to-t from-stone-900/40 to-transparent bg-clip-text pb-6 text-transparent select-none">
            <span className="font-serif text-[6rem] leading-none font-bold tracking-[0.2em] sm:text-[8rem] md:text-[12rem] lg:text-[16rem]">
              HIMA
            </span>
            <span className="-mt-4 font-serif text-[6rem] leading-none font-bold tracking-wider sm:-mt-8 sm:text-[8rem] md:-mt-12 md:text-[12rem] lg:-mt-16 lg:text-[16rem]">
              MUSIK
            </span>
          </div>
          {/* fade-out overlay at the bottom */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-stone-950 to-transparent" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
