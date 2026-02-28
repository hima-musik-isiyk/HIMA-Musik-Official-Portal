"use client";

import Link from "next/link";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

import BlurText from "@/components/BlurText";
import LightPillar from "@/components/LightPillar";
import TextPressure from "@/components/TextPressure";
import { gsap } from "@/lib/gsap";
import { shouldRunViewEntrance } from "@/lib/view-entrance";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const AccentLine = React.forwardRef<HTMLSpanElement>((_props, ref) => (
  <span
    ref={ref}
    className="bg-gold-500/40 block h-px w-8 md:w-12"
    aria-hidden="true"
  />
));
AccentLine.displayName = "AccentLine";

const Home: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroEyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const heroInstituteRef = useRef<HTMLParagraphElement | null>(null);
  const heroCtaRef = useRef<HTMLDivElement | null>(null);
  const heroAccentLineRef = useRef<HTMLSpanElement | null>(null);
  const heroDividerRef = useRef<HTMLDivElement | null>(null);
  const heroScrollIndicatorRef = useRef<HTMLDivElement | null>(null);
  const heroLightPillarRef = useRef<HTMLDivElement | null>(null);
  const quickLinksRef = useRef<HTMLDivElement | null>(null);
  const quickLinksHeaderRef = useRef<HTMLDivElement | null>(null);
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

    const shouldAnimate =
      typeof window !== "undefined" && shouldRunViewEntrance("/");

    if (!shouldAnimate) {
      skipAnimationRef.current = true;
      setDisableEntranceEffects(true);
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouchOnly =
      window.matchMedia("(pointer: coarse)").matches &&
      !window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion) {
      setDisableEntranceEffects(true);
      setDisablePressureEffect(true);
      return;
    }

    if (isTouchOnly) {
      setDisablePressureEffect(true);
    }

    const context = gsap.context(() => {
      const accentLine = heroAccentLineRef.current;
      const eyebrow = heroEyebrowRef.current;
      const institute = heroInstituteRef.current;
      const divider = heroDividerRef.current;
      const ctaContainer = heroCtaRef.current;
      const scrollIndicator = heroScrollIndicatorRef.current;
      const lightPillar = heroLightPillarRef.current;

      if (
        accentLine &&
        eyebrow &&
        institute &&
        divider &&
        ctaContainer &&
        scrollIndicator
      ) {
        const ctaButton = ctaContainer.children[0] as HTMLElement;
        const ctaParagraph = ctaContainer.children[1] as HTMLElement;

        gsap.set(accentLine, { opacity: 0, x: -10 });
        gsap.set(eyebrow, { opacity: 0, y: 6 });
        gsap.set(institute, { opacity: 0, y: 8 });
        gsap.set(divider, { scaleX: 0, transformOrigin: "left center" });
        gsap.set([ctaButton, ctaParagraph], { opacity: 0, y: 10 });
        gsap.set(scrollIndicator, { opacity: 0 });
        if (lightPillar) {
          gsap.set(lightPillar, { opacity: 0, x: 24 });
        }

        const tl = gsap.timeline({ delay: 0.25 });

        tl.addLabel("eyebrow")
          .to(
            accentLine,
            {
              opacity: 1,
              x: 0,
              duration: 0.7,
              ease: "expo.out",
              clearProps: "transform",
            },
            "eyebrow",
          )
          .to(
            eyebrow,
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: "expo.out",
              clearProps: "transform",
            },
            "eyebrow+=0.08",
          )
          .addLabel("institute", "eyebrow+=0.34")
          .to(
            institute,
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: "expo.out",
              clearProps: "transform",
            },
            "institute",
          )
          .to(
            lightPillar,
            {
              opacity: 1,
              x: 0,
              duration: 8,
              ease: "expo.out",
              clearProps: "transform",
            },
            "institute-=0.08",
          )
          .addLabel("divider", "eyebrow+=0.5")
          .to(
            divider,
            {
              scaleX: 1,
              duration: 1.0,
              ease: "expo.inOut",
              clearProps: "transform",
            },
            "divider",
          )
          .addLabel("cta", "divider+=0.3")
          .to(
            ctaButton,
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: "expo.out",
              clearProps: "transform",
            },
            "cta",
          )
          .to(
            ctaParagraph,
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: "expo.out",
              clearProps: "transform",
            },
            "cta+=0.12",
          )
          .addLabel("scroll", "cta+=0.45")
          .to(
            scrollIndicator,
            {
              opacity: 1,
              duration: 0.9,
              ease: "power2.out",
            },
            "scroll",
          );
      }

      if (quickLinksHeaderRef.current) {
        const headerChildren = Array.from(quickLinksHeaderRef.current.children);
        gsap.set(headerChildren, { opacity: 0, y: 8 });
        gsap.to(headerChildren, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "expo.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: quickLinksHeaderRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }

      if (quickLinksRef.current) {
        const quickLinkCards = quickLinksRef.current.querySelectorAll(
          "a[data-quick-link='true']",
        );
        if (quickLinkCards.length === 0) {
          return;
        }

        gsap.set(quickLinkCards, { opacity: 0, y: 20 });
        gsap.to(quickLinkCards, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "expo.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: quickLinksRef.current,
            start: "top 80%",
            once: true,
          },
        });
      }
    }, rootRef);

    return () => {
      context.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="w-full">
      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100svh-5rem)] flex-col justify-between border-b border-white/5 px-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -bottom-36 -z-10"
          aria-hidden="true"
        >
          <div
            ref={heroLightPillarRef}
            className="relative h-full w-full md:ml-auto md:w-[60vw] lg:w-[52vw]"
          >
            <LightPillar
              topColor="#D4A64D"
              bottomColor="#0a0a0a"
              intensity={1}
              glowAmount={0.005}
              pillarWidth={3.4}
              pillarHeight={0.46}
              noiseIntensity={0.35}
              className="opacity-15"
              mixBlendMode="screen"
              quality="medium"
            />
            <div className="absolute inset-x-0 top-0 bottom-0 bg-linear-to-b from-transparent via-stone-950/25 to-stone-950" />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute top-1/4 -left-20 h-128 w-lg rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 160, 122, 0.15)_0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -right-20 bottom-1/3 h-112 w-md rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(28, 25, 23, 0.3)_0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center">
          <div className="mb-6 flex items-center gap-4 md:mb-8">
            <AccentLine ref={heroAccentLineRef} />
            <p
              ref={heroEyebrowRef}
              className="text-xs font-medium tracking-[0.4em] text-stone-400/80 uppercase md:text-sm"
            >
              Himpunan Mahasiswa
            </p>
          </div>

          <h1 className="flex flex-col font-serif text-[5.5rem] leading-[0.88] tracking-tight text-white md:text-[9rem] lg:text-[11rem]">
            {disableEntranceEffects ? (
              <span className="inline-flex whitespace-nowrap">HIMA</span>
            ) : (
              <BlurText
                text="HIMA"
                className="inline-flex"
                animateBy="letters"
              />
            )}
            <div className="relative isolate min-h-[1em] w-full overflow-visible font-light text-stone-700 italic">
              {disablePressureEffect ? (
                disableEntranceEffects ? (
                  <span className="inline-block whitespace-nowrap text-stone-700">
                    MUSIK
                  </span>
                ) : (
                  <BlurText
                    text="MUSIK"
                    className="inline-flex text-stone-700"
                    animateBy="letters"
                  />
                )
              ) : musikPressureActive ? (
                <TextPressure
                  text="MUSIK"
                  className="translate-y-[0.04em]"
                  fontFamily="var(--font-serif)"
                  fontUrl=""
                  autoFit={false}
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

          <p
            ref={heroInstituteRef}
            className="mt-4 text-sm tracking-[0.08em] text-stone-500 md:text-base"
          >
            Institut Seni Indonesia Yogyakarta
          </p>

          <div className="mt-10 md:mt-14">
            <div
              ref={heroDividerRef}
              className="mb-10 h-px w-full bg-linear-to-r from-stone-800 via-stone-800/50 to-transparent md:mb-12 md:w-[50vw]"
              aria-hidden="true"
            />
            <div
              ref={heroCtaRef}
              className="flex flex-col items-start gap-8 md:flex-row md:items-center md:gap-12"
            >
              <Link href="/about" className="btn-primary shrink-0">
                <span className="btn-primary-label">Tentang Kami</span>
                <div className="btn-primary-overlay"></div>
              </Link>
              <p className="max-w-sm border-stone-800 text-[0.8125rem] leading-[1.7] font-light text-stone-500 md:border-l md:pl-12">
                Wadah kolektif mahasiswa Musik ISI Yogyakarta. Membangun
                ekosistem kreatif yang inklusif, progresif, dan berorientasi
                pada keunggulan artistik.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          ref={heroScrollIndicatorRef}
          className="relative z-10 flex justify-center pb-8 md:pb-10"
        >
          <div className="flex flex-col items-center gap-3 text-stone-600">
            <span className="text-[0.6rem] tracking-[0.35em] uppercase">
              Scroll
            </span>
            <span className="block h-6 w-px animate-pulse bg-stone-700" />
          </div>
        </div>
      </section>

      {/* Quick Links / Featured */}
      <section className="bg-stone-950 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div
            ref={quickLinksHeaderRef}
            className="mb-12 flex items-center gap-4 md:mb-16"
          >
            <AccentLine />
            <span className="text-[0.65rem] font-medium tracking-[0.4em] text-stone-600 uppercase">
              Jelajahi
            </span>
          </div>

          <div
            ref={quickLinksRef}
            className="grid grid-cols-1 gap-0 divide-y divide-stone-800/60 border-t border-b border-stone-800/60 md:grid-cols-3 md:divide-x md:divide-y-0"
          >
            <Link
              href="/about"
              data-quick-link="true"
              className="group relative flex cursor-pointer flex-col justify-between p-10 transition-colors duration-300 hover:bg-stone-900/50 md:p-12"
            >
              <div>
                <h3 className="mb-3 font-serif text-xl text-stone-300 transition-colors duration-300 group-hover:text-white md:text-2xl">
                  Tentang Kami
                </h3>
                <p className="text-[0.8125rem] leading-relaxed text-stone-600 transition-colors duration-300 group-hover:text-stone-400">
                  Sejarah, visi, dan struktur organisasi HIMA.
                </p>
              </div>
              <span className="group-hover:text-gold-500 mt-8 inline-flex items-center gap-2 text-[0.65rem] tracking-[0.3em] text-stone-700 uppercase transition-colors duration-300">
                Selengkapnya
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="translate-x-0 transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            <Link
              href="/events"
              data-quick-link="true"
              className="group relative flex cursor-pointer flex-col justify-between p-10 transition-colors duration-300 hover:bg-stone-900/50 md:p-12"
            >
              <div>
                <h3 className="mb-3 font-serif text-xl text-stone-300 transition-colors duration-300 group-hover:text-white md:text-2xl">
                  Program Kerja
                </h3>
                <p className="text-[0.8125rem] leading-relaxed text-stone-600 transition-colors duration-300 group-hover:text-stone-400">
                  Konser tahunan, workshop, dan diskusi publik.
                </p>
              </div>
              <span className="group-hover:text-gold-500 mt-8 inline-flex items-center gap-2 text-[0.65rem] tracking-[0.3em] text-stone-700 uppercase transition-colors duration-300">
                Selengkapnya
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="translate-x-0 transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            <Link
              href="/aduan"
              data-quick-link="true"
              className="group relative flex cursor-pointer flex-col justify-between p-10 transition-colors duration-300 hover:bg-stone-900/50 md:p-12"
            >
              <div>
                <h3 className="mb-3 font-serif text-xl text-stone-300 transition-colors duration-300 group-hover:text-white md:text-2xl">
                  Layanan Aduan
                </h3>
                <p className="text-[0.8125rem] leading-relaxed text-stone-600 transition-colors duration-300 group-hover:text-stone-400">
                  Saluran aspirasi dan advokasi akademik.
                </p>
              </div>
              <span className="group-hover:text-gold-500 mt-8 inline-flex items-center gap-2 text-[0.65rem] tracking-[0.3em] text-stone-700 uppercase transition-colors duration-300">
                Selengkapnya
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="translate-x-0 transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <AccentLine />
              <span className="text-[0.65rem] font-medium tracking-[0.4em] text-stone-600 uppercase">
                Open Recruitment
              </span>
            </div>
            <h2 className="font-serif text-4xl tracking-tight text-white md:text-6xl">
              Jadi{" "}
              <span className="text-gold-500 font-light italic">Pengurus</span>{" "}
              HIMA
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-neutral-400">
              Semua informasi rekrutmen ada di satu halaman: struktur kabinet,
              panduan divisi, timeline seleksi, lalu lanjut isi formulir saat
              kamu siap.
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
                detail:
                  "Lihat susunan BPH dan posisi yang sedang dibuka dengan visual yang jelas.",
              },
              {
                step: "02",
                title: "Panduan Divisi",
                detail:
                  "Bandingkan fokus kerja, tugas utama, skill ideal, dan komitmen tiap divisi.",
              },
              {
                step: "03",
                title: "Timeline Seleksi",
                detail:
                  "Pantau tahapan dari pendaftaran hingga pengumuman agar kamu bisa siap dari awal.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-6 border border-white/5 bg-white/2 p-6 md:p-8"
              >
                <div>
                  <h3 className="mb-2 font-serif text-xl text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-400">
                    {item.detail}
                  </p>
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
