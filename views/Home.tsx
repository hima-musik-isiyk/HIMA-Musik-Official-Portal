"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BlurText from "@/components/BlurText";
import TextPressure from "@/components/TextPressure";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const AccentLine: React.FC = () => (
  <span className="block w-8 md:w-12 h-px bg-gold-500/40" aria-hidden="true" />
);

const Home: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroEyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const heroCtaRef = useRef<HTMLDivElement | null>(null);
  const quickLinksRef = useRef<HTMLDivElement | null>(null);
  const skipAnimationRef = useRef(false);
  const [disableEntranceEffects, setDisableEntranceEffects] = useState(false);
  const [disablePressureEffect, setDisablePressureEffect] = useState(false);
  const [musikPressureActive, setMusikPressureActive] = useState(false);

  useEffect(() => {
    if (disablePressureEffect) {
      setMusikPressureActive(false);
      return;
    }

    if (disableEntranceEffects) {
      setMusikPressureActive(true);
      return;
    }

    setMusikPressureActive(false);
  }, [disableEntranceEffects, disablePressureEffect]);

  useIsomorphicLayoutEffect(() => {
    if (skipAnimationRef.current) {
      setDisableEntranceEffects(true);
      return;
    }

    const shouldSkipAnimation =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("skipHomeGsapOnce") === "true";

    if (shouldSkipAnimation && typeof window !== "undefined") {
      skipAnimationRef.current = true;
      window.sessionStorage.removeItem("skipHomeGsapOnce");
      setDisableEntranceEffects(true);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchOnly = window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || isTouchOnly) {
      setDisableEntranceEffects(true);
      setDisablePressureEffect(true);
      return;
    }

    const context = gsap.context(() => {
      if (heroEyebrowRef.current && heroCtaRef.current) {
        const heroCtaChildren = Array.from(heroCtaRef.current.children);
        const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        heroTimeline
          .fromTo(heroEyebrowRef.current,
            { y: 16, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              immediateRender: true,
            }
          )
          .fromTo(
            heroCtaChildren,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.15,
              immediateRender: true,
              clearProps: "transform",
            },
            "-=0.4"
          );
      }

      if (quickLinksRef.current) {
        const quickLinkCards = quickLinksRef.current.querySelectorAll("a[data-quick-link='true']");
        if (quickLinkCards.length === 0) {
          return;
        }

        gsap.fromTo(quickLinkCards,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: quickLinksRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }
    }, rootRef);

    return () => {
      context.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100svh-5rem)] flex flex-col justify-between px-6 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-1/4 -left-20 w-lg h-128 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 160, 122, 0.15)_0%, transparent 70%)'
            }}
          />
          <div
            className="absolute bottom-1/3 -right-20 w-md h-112 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(28, 25, 23, 0.3)_0%, transparent 70%)'
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <AccentLine />
            <p
              ref={heroEyebrowRef}
              className={`text-xs md:text-sm uppercase tracking-[0.4em] text-stone-400/80 font-medium ${!disableEntranceEffects ? 'opacity-0' : ''}`}
            >
              Himpunan Mahasiswa Musik &mdash; Institut Seni Indonesia Yogyakarta
            </p>
          </div>

          <h1
            className="font-serif text-[5.5rem] md:text-[9rem] lg:text-[11rem] text-white leading-[0.88] tracking-tight flex flex-col"
          >
            {disableEntranceEffects ? (
              <span className="inline-flex whitespace-nowrap">HIMA</span>
            ) : (
              <BlurText text="HIMA" className="inline-flex" animateBy="letters" />
            )}
            <div className="italic text-stone-700 font-light min-h-[1em] relative w-full overflow-visible isolate">
              {disablePressureEffect ? (
                <span className="inline-block whitespace-nowrap text-stone-700">MUSIK</span>
              ) : musikPressureActive ? (
                <TextPressure
                  text="MUSIK"
                  fontFamily="var(--font-serif)"
                  fontUrl=""
                  width={false}
                  textColor={"var(--color-stone-700)"}
                  stroke={false}
                  flex={false}
                  warmupDuration={1200}
                  actuationDuration={1200}
                  actuationWghtFrom={300}
                  minWghtFloor={300}
                />
              ) : (
                <BlurText
                  text="MUSIK"
                  className="inline-flex text-stone-700"
                  animateBy="letters"
                  onAnimationComplete={() => setMusikPressureActive(true)}
                />
              )}
            </div>
          </h1>

          <div className="mt-10 md:mt-14">
            <div className="w-full h-px bg-linear-to-r from-stone-800 via-stone-800/50 to-transparent mb-10 md:mb-12" aria-hidden="true" />
            <div
              ref={heroCtaRef}
              className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center"
            >
              <Link
                href="/about"
                className={`btn-primary shrink-0 ${!disableEntranceEffects ? 'opacity-0' : ''}`}
              >
                <span className="btn-primary-label">Tentang Kami</span>
                <div className="btn-primary-overlay"></div>
              </Link>
              <p className={`max-w-sm text-stone-500 text-[0.8125rem] leading-[1.7] md:border-l border-stone-800 md:pl-12 font-light ${!disableEntranceEffects ? 'opacity-0' : ''}`}>
                Wadah kolektif mahasiswa musik. Membangun ekosistem
                akademik yang inklusif dan progresif.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8 md:pb-10">
          <div className="flex flex-col items-center gap-3 text-stone-600">
            <span className="text-[0.6rem] uppercase tracking-[0.35em]">Scroll</span>
            <span className="block w-px h-6 bg-stone-700 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Quick Links / Featured */}
      <section className="py-20 md:py-28 px-6 bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12 md:mb-16">
            <AccentLine />
            <span className="text-[0.65rem] uppercase tracking-[0.4em] text-stone-600 font-medium">Jelajahi</span>
          </div>

          <div
            ref={quickLinksRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-stone-800/60 border-t border-b border-stone-800/60"
          >
            <Link
              href="/about"
              data-quick-link="true"
              className={`group relative flex flex-col justify-between p-10 md:p-12 hover:bg-stone-900/50 transition-colors duration-300 cursor-pointer ${!disableEntranceEffects ? 'opacity-0' : ''}`}
            >
              <div>
                <span className="text-[0.65rem] font-mono text-stone-700 tracking-wider mb-5 block">
                  01
                </span>
                <h3 className="font-serif text-xl md:text-2xl text-stone-300 mb-3 group-hover:text-white transition-colors duration-300">
                  Tentang Kami
                </h3>
                <p className="text-[0.8125rem] leading-relaxed text-stone-600 group-hover:text-stone-400 transition-colors duration-300">
                  Sejarah, visi, dan struktur organisasi HIMA.
                </p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-stone-700 group-hover:text-gold-500 transition-colors duration-300">
                Selengkapnya
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="translate-x-0 group-hover:translate-x-1 transition-transform duration-300"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </span>
            </Link>

            <Link
              href="/events"
              data-quick-link="true"
              className={`group relative flex flex-col justify-between p-10 md:p-12 hover:bg-stone-900/50 transition-colors duration-300 cursor-pointer ${!disableEntranceEffects ? 'opacity-0' : ''}`}
            >
              <div>
                <span className="text-[0.65rem] font-mono text-stone-700 tracking-wider mb-5 block">
                  02
                </span>
                <h3 className="font-serif text-xl md:text-2xl text-stone-300 mb-3 group-hover:text-white transition-colors duration-300">
                  Program Kerja
                </h3>
                <p className="text-[0.8125rem] leading-relaxed text-stone-600 group-hover:text-stone-400 transition-colors duration-300">
                  Konser tahunan, workshop, dan diskusi publik.
                </p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-stone-700 group-hover:text-gold-500 transition-colors duration-300">
                Selengkapnya
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="translate-x-0 group-hover:translate-x-1 transition-transform duration-300"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </span>
            </Link>

            <Link
              href="/aduan"
              data-quick-link="true"
              className={`group relative flex flex-col justify-between p-10 md:p-12 hover:bg-stone-900/50 transition-colors duration-300 cursor-pointer ${!disableEntranceEffects ? 'opacity-0' : ''}`}
            >
              <div>
                <span className="text-[0.65rem] font-mono text-stone-700 tracking-wider mb-5 block">
                  03
                </span>
                <h3 className="font-serif text-xl md:text-2xl text-stone-300 mb-3 group-hover:text-white transition-colors duration-300">
                  Layanan Aduan
                </h3>
                <p className="text-[0.8125rem] leading-relaxed text-stone-600 group-hover:text-stone-400 transition-colors duration-300">
                  Saluran aspirasi dan advokasi akademik.
                </p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-stone-700 group-hover:text-gold-500 transition-colors duration-300">
                Selengkapnya
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="translate-x-0 group-hover:translate-x-1 transition-transform duration-300"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <AccentLine />
              <span className="text-[0.65rem] uppercase tracking-[0.4em] text-stone-600 font-medium">
                Open Recruitment
              </span>
            </div>
            <h2 className="font-serif text-4xl md:text-6xl text-white tracking-tight">
              Jadi <span className="italic text-gold-500/80 font-light">Pengurus</span> HIMA
            </h2>
            <p className="text-neutral-400 text-sm mt-5 leading-relaxed max-w-xl">
              Semua informasi rekrutmen ada di satu halaman: struktur kabinet,
              panduan divisi, timeline seleksi, lalu lanjut isi formulir saat kamu siap.
            </p>
            <div className="mt-8">
              <Link href="/pendaftaran" className="btn-primary">
                <span className="btn-primary-label">Buka Info Pendaftaran</span>
                <div className="btn-primary-overlay"></div>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {[
              {
                step: "01",
                title: "Struktur & Posisi Terbuka",
                detail: "Lihat susunan BPH dan posisi yang sedang dibuka dengan visual yang jelas.",
              },
              {
                step: "02",
                title: "Panduan Divisi",
                detail: "Bandingkan fokus kerja, tugas utama, skill ideal, dan komitmen tiap divisi.",
              },
              {
                step: "03",
                title: "Timeline Seleksi",
                detail: "Pantau tahapan dari pendaftaran hingga pengumuman agar kamu bisa siap dari awal.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="border border-white/5 bg-white/2 p-6 md:p-8 flex items-start gap-6"
              >
                <span className="text-[0.75rem] font-mono text-stone-700 tracking-wider">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-serif text-xl text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
