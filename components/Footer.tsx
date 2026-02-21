"use client";

import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 pt-24 pb-12 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-gold-500/20 to-transparent"></div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="col-span-1 md:col-span-2">
          <h3 className="font-serif text-3xl mb-6 text-white tracking-widest">
            HIMA<span className="italic text-gold-500 font-light">MUSIK</span>
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-md font-light">
            Himpunan Mahasiswa Program Studi Musik, Fakultas Seni Pertunjukan,
            Institut Seni Indonesia Yogyakarta. Wadah aspirasi dan kreasi
            mahasiswa musik.
          </p>
        </div>

        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-500 mb-8">
            Navigasi
          </h4>
          <ul className="space-y-5 text-sm text-neutral-400 font-light">
            <li>
              <Link href="/" className="hover:text-gold-600 transition-colors">
                Beranda
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-gold-600 transition-colors"
              >
                Tentang Kami
              </Link>
            </li>
            <li>
              <Link
                href="/events"
                className="hover:text-gold-600 transition-colors"
              >
                Jadwal Acara
              </Link>
            </li>
            <li>
              <Link
                href="/aduan"
                className="hover:text-gold-600 transition-colors"
              >
                Layanan Aduan
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-500 mb-8">
            Kontak
          </h4>
          <ul className="space-y-5 text-sm text-neutral-400 font-light">
            <li>HIMA Prodi Musik, FSP ISI Yogyakarta</li>
            <li>Gedung Jurasik (Jurusan Musik) Lt. 2</li>
            <li>
              <a
                href="mailto:musikisiyk@gmail.com"
                className="hover:text-gold-600 transition-colors"
              >
                musikisiyk@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/himamusikisi"
                target="_blank"
                rel="noreferrer"
                className="hover:text-gold-600 transition-colors"
              >
                @himamusikisi
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[11px] text-neutral-500 font-light tracking-wider">
        <p>&copy; {new Date().getFullYear()} Himpunan Mahasiswa Musik.</p>
        <p className="mt-4 md:mt-0 uppercase tracking-[0.3em] text-gold-500">Emergence</p>
      </div>
    </footer>
  );
};

export default Footer;
