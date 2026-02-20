"use client";

import React from "react";
import Link from "next/link";

const Home: React.FC = () => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center px-6 border-b border-stone-800 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-linear-to-t from-stone-950 to-transparent"></div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-stone-400 mb-6 animate-pulse">
            Himpunan Mahasiswa Musik
          </p>
          <h1 className="font-serif text-5xl md:text-8xl lg:text-9xl text-white leading-tight mix-blend-overlay">
            KABINET <br />
            <span className="italic text-stone-400">2026</span>
          </h1>
          <div className="mt-12 md:mt-16 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <Link
              href="/about"
              className="group relative px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest overflow-hidden transition-all hover:bg-stone-200"
            >
              <span className="relative z-10">About Us</span>
            </Link>
            <p className="max-w-md text-stone-500 text-sm leading-relaxed border-l border-stone-700 pl-6">
              Harmony in diversity, rhythm in unity.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links / Featured */}
      <section className="py-24 px-6 bg-stone-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-stone-800 border-t border-b border-stone-800">
          <Link
            href="/about"
            className="p-12 hover:bg-stone-900 transition-colors cursor-pointer group block"
          >
            <span className="text-xs font-mono text-stone-600 mb-4 block">
              01
            </span>
            <h3 className="font-serif text-2xl text-stone-300 mb-2 group-hover:text-white">
              Tentang Kami
            </h3>
            <p className="text-sm text-stone-600 group-hover:text-stone-400 transition-colors">
              Sejarah, visi, dan struktur organisasi HIMA.
            </p>
          </Link>

          <Link
            href="/events"
            className="p-12 hover:bg-stone-900 transition-colors cursor-pointer group block"
          >
            <span className="text-xs font-mono text-stone-600 mb-4 block">
              02
            </span>
            <h3 className="font-serif text-2xl text-stone-300 mb-2 group-hover:text-white">
              Program Kerja
            </h3>
            <p className="text-sm text-stone-600 group-hover:text-stone-400 transition-colors">
              Konser tahunan, workshop, dan diskusi publik.
            </p>
          </Link>

          <Link
            href="/aduan"
            className="p-12 hover:bg-stone-900 transition-colors cursor-pointer group block"
          >
            <span className="text-xs font-mono text-stone-600 mb-4 block">
              03
            </span>
            <h3 className="font-serif text-2xl text-stone-300 mb-2 group-hover:text-white">
              Layanan Aduan
            </h3>
            <p className="text-sm text-stone-600 group-hover:text-stone-400 transition-colors">
              Saluran aspirasi dan advokasi akademik.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
