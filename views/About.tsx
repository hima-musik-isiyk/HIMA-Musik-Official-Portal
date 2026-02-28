"use client";

import React, { useEffect, useRef } from "react";

import LightPillar from "@/components/LightPillar";
import { gsap } from "@/lib/gsap";
import { shouldRunViewEntrance } from "@/lib/view-entrance";

const About: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const executives = [
    { role: "Ketua Himpunan", name: "Vincent Nuridzati Adittama" },
    { role: "Wakil Ketua", name: "Nadia Fibriani" },
    { role: "Sekretaris", name: "Nuzulul Dian Maulida" },
    { role: "Bendahara", name: "Elizabeth Ardhayu Maheswari" },
  ];

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    if (!shouldRunViewEntrance("/about")) return;

    const ctx = gsap.context(() => {
      const defaults = { ease: "power3.out", duration: 0.8 };

      gsap.fromTo(
        ".about-eyebrow",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, ...defaults },
      );

      gsap.fromTo(
        ".about-title",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, ...defaults, delay: 0.1 },
      );

      gsap.fromTo(
        ".about-body",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, ...defaults, delay: 0.25 },
      );

      gsap.fromTo(
        ".about-visual",
        { opacity: 0, scale: 0.97 },
        { opacity: 1, scale: 1, duration: 1, ease: "power2.out", delay: 0.3 },
      );

      gsap.fromTo(
        ".about-chart-header",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ...defaults,
          scrollTrigger: {
            trigger: ".about-chart-header",
            start: "top 85%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".about-exec-card",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-exec-card",
            start: "top 85%",
            once: true,
          },
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-x-hidden px-6 pt-40 pb-32"
    >
      <div className="pointer-events-none absolute inset-0 w-full bg-[radial-gradient(circle_at_top_right,rgba(212,166,77,0.03)_0%,transparent_70%)]"></div>
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="about-eyebrow mb-12 flex items-center gap-4">
          <span
            className="bg-gold-500/40 block h-px w-8 md:w-12"
            aria-hidden="true"
          />
          <p className="text-gold-500 text-sm font-medium">Profil Organisasi</p>
        </div>
        <div className="mb-32 grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-24">
          <div className="flex flex-col gap-12 md:col-span-7">
            <h1 className="about-title font-serif text-6xl tracking-tight text-white md:text-8xl">
              Kabinet{" "}
              <span className="text-gold-500/80 font-light italic">2026</span>
            </h1>

            <div className="about-body text-lg leading-relaxed font-light text-neutral-400">
              <p className="first-letter:text-gold-500 mb-8 first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-7xl">
                Himpunan Mahasiswa Musik (HIMA MUSIK) adalah ruang kolektif
                mahasiswa musik di lingkungan ISI Yogyakarta yang berfokus pada
                pengembangan keilmuan, praktik artistik, dan solidaritas
                antarmahasiswa. Akar ekosistem musik kampus ini tidak lepas dari
                warisan Akademi Musik Indonesia (AMI) yang kemudian berproses
                dalam struktur ISI Yogyakarta.
              </p>
              <p>
                Dalam perjalanannya, bentuk organisasi mahasiswa musik dapat
                mengalami fase transisi, reorganisasi, dan pembaruan antar
                generasi. Karena itu, profil ini menempatkan HIMA MUSIK sebagai
                kelanjutan semangat kolaborasi mahasiswa musik: merawat tradisi,
                mendorong eksplorasi kontemporer, serta memperkuat kontribusi
                bagi ekosistem seni pertunjukan.
              </p>
            </div>
          </div>
          <div
            className="about-visual group relative aspect-3/4 w-full overflow-hidden bg-[#111] md:col-span-5"
            aria-hidden="true"
          >
            <div className="bg-gold-500/10 absolute inset-0 z-10 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-0"></div>
            <LightPillar
              topColor="#D4A64D"
              bottomColor="#0a0a0a"
              intensity={1.5}
              className="opacity-70 transition-opacity duration-1000 ease-out group-hover:opacity-100"
            />
            <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-1/2 w-full bg-linear-to-t from-[#0a0a0a] to-transparent"></div>
          </div>
        </div>

        <div className="relative border-t border-white/5 pt-24">
          <div className="bg-gold-500/50 absolute top-0 left-0 h-px w-24"></div>
          <h2 className="about-chart-header mb-16 font-serif text-4xl tracking-tight text-white md:text-5xl">
            Struktur Kabinet <br />
            <span className="text-gold-500 text-3xl font-light italic">
              2026
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 md:grid-cols-4">
            {executives.map((exec, idx) => (
              <div
                key={idx}
                className="about-exec-card group hover:border-gold-300 relative border-l border-white/5 pl-6 transition-colors duration-500"
              >
                <p className="text-gold-500 group-hover:text-gold-300 mb-3 text-sm font-medium transition-colors duration-500">
                  {exec.role}
                </p>
                <p className="font-serif text-xl text-neutral-300 transition-colors duration-500 group-hover:text-white">
                  {exec.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
