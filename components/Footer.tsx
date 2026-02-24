"use client";

import Link from "next/link";
import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-2 border-t border-stone-900 bg-stone-950 px-8 pt-24 pb-14 md:pt-28 md:pb-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-6">
          <Link href="/" className="group mb-8 inline-flex flex-col">
            <span className="font-serif text-3xl leading-none tracking-tighter text-white">
              HIMA
              <span className="group-hover:text-gold-300 text-stone-500 italic transition-colors">
                MUSIK
              </span>
            </span>
            <span className="mt-2 text-xs tracking-[0.6em] text-stone-600 uppercase">
              Institut Seni Indonesia Yogyakarta
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-loose tracking-[0.2em] text-stone-500 uppercase">
            Himpunan Mahasiswa Program Studi Musik, Fakultas Seni Pertunjukan. A
            collective dedicated to the pursuit of musical and intellectual
            excellence.
          </p>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-md mb-8 font-bold tracking-[0.4em] text-white uppercase">
            Navigasi
          </h4>
          <ul className="space-y-4 text-sm tracking-[0.3em] text-stone-500 uppercase">
            <li>
              <Link href="/" className="hover:text-gold-300 transition-colors">
                Beranda
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-gold-300 transition-colors"
              >
                Tentang Kami
              </Link>
            </li>
            <li>
              <Link
                href="/events"
                className="hover:text-gold-300 transition-colors"
              >
                Kalender Acara
              </Link>
            </li>
            <li>
              <Link
                href="/gallery"
                className="hover:text-gold-300 transition-colors"
              >
                Galeri Visual
              </Link>
            </li>
            <li>
              <Link
                href="/aduan"
                className="hover:text-gold-300 transition-colors"
              >
                Layanan Aduan
              </Link>
            </li>
            <li>
              <Link
                href="/pendaftaran"
                className="hover:text-gold-300 transition-colors"
              >
                Pendaftaran
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-md mb-8 font-bold tracking-[0.4em] text-white uppercase">
            Kontak
          </h4>
          <ul className="min-w-0 space-y-4 text-sm tracking-[0.2em] text-stone-500 uppercase">
            <li className="leading-relaxed">
              FSP ISI Yogyakarta
              <br />
              Gedung Jurasik Lt. 2
            </li>
            <li className="min-w-0">
              <a
                href="mailto:musikisiyk@gmail.com"
                className="hover:text-gold-300 inline-block max-w-full border-b border-stone-900 pb-1 break-all transition-colors"
              >
                musikisiyk@gmail.com
              </a>
            </li>
            <li className="min-w-0">
              <a
                href="https://instagram.com/himamusikisi"
                target="_blank"
                rel="noreferrer"
                className="hover:text-gold-300 inline-block max-w-full border-b border-stone-900 pb-1 break-all transition-colors"
              >
                @himamusikisi
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-24 flex max-w-7xl flex-col items-center justify-between border-t border-stone-900/50 pt-10 text-xs tracking-[0.5em] text-stone-700 uppercase md:mt-28 md:flex-row md:pt-12">
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
