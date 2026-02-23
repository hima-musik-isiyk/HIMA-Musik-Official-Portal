"use client";

import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-950 border-t border-stone-900 pt-24 md:pt-28 pb-14 md:pb-16 px-8 relative z-[2]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
        <div className="md:col-span-6">
          <Link href="/" className="group inline-flex flex-col mb-8">
            <span className="font-serif text-3xl tracking-tighter text-white leading-none">
              HIMA<span className="italic text-stone-500 group-hover:text-gold-300 transition-colors">MUSIK</span>
            </span>
            <span className="text-xs uppercase tracking-[0.6em] text-stone-600 mt-2">Institut Seni Indonesia Yogyakarta</span>
          </Link>
          <p className="text-stone-500 text-sm uppercase tracking-[0.2em] leading-loose max-w-sm">
            Himpunan Mahasiswa Program Studi Musik, Fakultas Seni Pertunjukan. 
            A collective dedicated to the pursuit of musical and intellectual excellence.
          </p>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-md font-bold uppercase tracking-[0.4em] text-white mb-8">
            Navigasi
          </h4>
          <ul className="space-y-4 text-sm uppercase tracking-[0.3em] text-stone-500">
            <li>
              <Link href="/" className="hover:text-gold-300 transition-colors">Beranda</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-gold-300 transition-colors">Tentang Kami</Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-gold-300 transition-colors">Kalender Acara</Link>
            </li>
            <li>
              <Link href="/gallery" className="hover:text-gold-300 transition-colors">Galeri Visual</Link>
            </li>
            <li>
              <Link href="/aduan" className="hover:text-gold-300 transition-colors">Layanan Aduan</Link>
            </li>
            <li>
              <Link href="/pendaftaran" className="hover:text-gold-300 transition-colors">Pendaftaran</Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-md font-bold uppercase tracking-[0.4em] text-white mb-8">
            Kontak
          </h4>
          <ul className="space-y-4 text-sm uppercase tracking-[0.2em] text-stone-500 min-w-0">
            <li className="leading-relaxed">
              FSP ISI Yogyakarta<br />
              Gedung Jurasik Lt. 2
            </li>
            <li className="min-w-0">
              <a href="mailto:musikisiyk@gmail.com" className="hover:text-gold-300 transition-colors border-b border-stone-900 pb-1 break-all inline-block max-w-full">
                musikisiyk@gmail.com
              </a>
            </li>
            <li className="min-w-0">
              <a href="https://instagram.com/himamusikisi" target="_blank" rel="noreferrer" className="hover:text-gold-300 transition-colors border-b border-stone-900 pb-1 break-all inline-block max-w-full">
                @himamusikisi
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 md:mt-28 pt-10 md:pt-12 border-t border-stone-900/50 flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-[0.5em] text-stone-700">
        <p className="text-center md:text-left">&copy; {currentYear} HIMA MUSIK ISI YOGYAKARTA</p>
        <p className="mt-4 md:mt-0 uppercase tracking-[0.3em] text-gold-500">
          Emergence
        </p>
      </div>
    </footer>
  );
};

export default Footer;
