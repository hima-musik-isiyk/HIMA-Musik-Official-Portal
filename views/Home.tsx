"use client";

import React from "react";
import Link from "next/link";

const Home: React.FC = () => {
  return (
    <div className="w-full bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center px-6 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,166,77,0.05)_0%,transparent_60%)]"></div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-12 bg-gold-500/50"></div>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-gold-400 font-medium">
              Himpunan Mahasiswa Musik
            </p>
          </div>
          <h1 className="font-serif text-6xl md:text-8xl lg:text-[10rem] text-white leading-[0.9] tracking-tight">
            KABINET <br />
            <span className="italic text-gold-500/80 font-light">2026</span>
          </h1>
          <div className="mt-16 md:mt-24 flex flex-col md:flex-row gap-10 items-start md:items-center">
            <Link
              href="/about"
              className="group relative px-10 py-5 bg-white text-black text-[11px] font-bold uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-gold-400 hover:text-white"
            >
              <span className="relative z-10">Tentang Kami</span>
              <div className="absolute inset-0 bg-gold-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            </Link>
            <p className="max-w-md text-neutral-400 text-sm leading-relaxed border-l border-gold-500/30 pl-8 font-light">
              Harmony in diversity, rhythm in unity. Membangun ekosistem akademik yang inklusif dan progresif.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links / Featured */}
      <section className="py-32 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-gold-500/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5 border-y border-white/5">
          <Link
            href="/about"
            className="p-16 hover:bg-white/[0.02] transition-all duration-500 cursor-pointer group block relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gold-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
            <span className="text-[10px] font-mono text-gold-500/50 mb-8 block tracking-widest">
              01
            </span>
            <h3 className="font-serif text-3xl text-neutral-200 mb-4 group-hover:text-gold-400 transition-colors duration-500">
              Tentang Kami
            </h3>
            <p className="text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors font-light leading-relaxed">
              Sejarah, visi, dan struktur organisasi HIMA.
            </p>
          </Link>

          <Link
            href="/events"
            className="p-16 hover:bg-white/[0.02] transition-all duration-500 cursor-pointer group block relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gold-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
            <span className="text-[10px] font-mono text-gold-500/50 mb-8 block tracking-widest">
              02
            </span>
            <h3 className="font-serif text-3xl text-neutral-200 mb-4 group-hover:text-gold-400 transition-colors duration-500">
              Program Kerja
            </h3>
            <p className="text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors font-light leading-relaxed">
              Konser tahunan, workshop, dan diskusi publik.
            </p>
          </Link>

          <Link
            href="/aduan"
            className="p-16 hover:bg-white/[0.02] transition-all duration-500 cursor-pointer group block relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gold-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
            <span className="text-[10px] font-mono text-gold-500/50 mb-8 block tracking-widest">
              03
            </span>
            <h3 className="font-serif text-3xl text-neutral-200 mb-4 group-hover:text-gold-400 transition-colors duration-500">
              Layanan Aduan
            </h3>
            <p className="text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors font-light leading-relaxed">
              Saluran aspirasi dan advokasi akademik.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
