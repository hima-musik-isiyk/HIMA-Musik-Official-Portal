"use client";

import Link from "next/link";
import React from "react";

import LogoHima from "./LogoHima";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-2 border-t border-stone-900 bg-stone-950 px-8 pt-24 pb-12 md:pt-12 md:pb-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-6">
          <div className="relative flex flex-col items-start md:-left-64 md:w-[calc(100%+16rem)] md:flex-row md:items-start">
            <Link href="/" className="group inline-flex shrink-0 flex-col">
              <LogoHima
                lineColor="white"
                glyphColor="var(--color-gold-500)"
                textColor="white"
                showLines={false}
                showText={false}
                className="h-16 w-auto transition-all duration-300 group-hover:opacity-90 md:h-64"
              />
            </Link>
            <p className="min-w-0 flex-1 text-sm leading-loose tracking-[0.2em] text-stone-500 uppercase">
              Himpunan Mahasiswa Program Studi Musik, Fakultas Seni Pertunjukan.
              A collective dedicated to the pursuit of musical and intellectual
              excellence.
            </p>
          </div>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-gold-500 mb-10 font-serif text-lg font-medium tracking-[0.2em] uppercase">
            Navigasi
          </h4>
          <ul className="space-y-4 text-sm tracking-[0.2em] text-stone-500 uppercase md:space-y-3">
            {[
              { name: "Beranda", href: "/" },
              { name: "Profil", href: "/about" },
              { name: "Kalender Acara", href: "/events" },
              { name: "Galeri Visual", href: "/gallery" },
              { name: "Pusat Administrasi", href: "/sekretariat" },
              { name: "Ruang Advokasi", href: "/aduan" },
              { name: "Open Recruitment", href: "/pendaftaran" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group hover:text-gold-300 relative flex items-center justify-between border-b border-stone-900/50 py-3 transition-colors md:block md:border-0 md:py-0"
                >
                  <div className="flex items-center">
                    <span className="bg-gold-500 absolute -left-4 hidden h-1 w-1 scale-0 rounded-full transition-all duration-300 group-hover:-left-3 group-hover:scale-100 md:block" />
                    <span className="transition-transform duration-300 md:group-hover:translate-x-1">
                      {link.name}
                    </span>
                  </div>
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
                    className="lucide lucide-chevron-right group-hover:text-gold-500 text-stone-700 transition-transform duration-300 group-hover:translate-x-1 md:hidden"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-gold-500 mb-10 font-serif text-lg font-medium tracking-[0.2em] uppercase">
            Kontak
          </h4>

          <div className="space-y-8 md:space-y-3">
            <div className="space-y-4 md:space-y-2">
              <span className="block text-[10px] font-bold tracking-[0.4em] text-stone-700 uppercase">
                Studio & Sekretariat
              </span>
              <p className="text-sm leading-relaxed tracking-[0.15em] text-stone-500 uppercase">
                FSP ISI Yogyakarta
                <br />
                Gedung Jurasik Lt. 2
              </p>
            </div>

            <div className="space-y-2">
              <span className="block text-[10px] font-bold tracking-[0.4em] text-stone-700 uppercase">
                Electronic Mail
              </span>
              <a
                href="mailto:musikisiyk@gmail.com"
                className="group hover:text-gold-300 flex items-center gap-3 text-sm tracking-widest text-stone-500 transition-colors"
              >
                <div className="group-hover:border-gold-500/50 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-900 transition-colors">
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
                    className="lucide lucide-mail"
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

            <div className="space-y-2">
              <span className="block text-[10px] font-bold tracking-[0.4em] text-stone-700 uppercase">
                Social Media
              </span>
              <a
                href="https://instagram.com/himamusikisi"
                target="_blank"
                rel="noreferrer"
                className="group hover:text-gold-300 flex items-center gap-3 text-sm tracking-widest text-stone-500 transition-colors"
              >
                <div className="group-hover:border-gold-500/50 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-900 transition-colors">
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
                    className="lucide lucide-instagram"
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
      </div>

      <div className="mx-auto mt-24 flex max-w-7xl flex-col items-center justify-between border-t border-stone-900/50 pt-10 text-xs tracking-[0.5em] text-stone-700 uppercase md:mt-12 md:flex-row md:pt-16">
        <p className="text-center md:text-left">
          &copy; {currentYear} HIMA MUSIK ISI YOGYAKARTA
        </p>
        <p
          className="text-gold-500 mt-4 tracking-[0.3em] uppercase md:mt-0"
          title="Nama Kabinet HIMA Musik 2026"
        >
          Kabinet Emergence
        </p>
      </div>
    </footer>
  );
};

export default Footer;
