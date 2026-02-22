"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BlurText from "@/components/BlurText";
import TextPressure from "@/components/TextPressure";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
    if (reduceMotion) {
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
      <section className="relative h-[calc(100svh-5rem)] flex flex-col justify-center px-6 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-1/4 -left-20 w-96 h-96 rounded-full"
            style={{
              background: 'radial-gradient(closest-side, rgba(255, 160, 122, 0.10), transparent 70%)'
            }}
          />
          <div
            className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full"
            style={{
              background: 'radial-gradient(closest-side, rgba(28, 25, 23, 0.20), transparent 70%)'
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p
            ref={heroEyebrowRef}
            className={`text-xs md:text-sm uppercase tracking-[0.4em] text-stone-300/50 font-medium mb-12 ${!disableEntranceEffects ? 'opacity-0' : ''}`}
          >
            Institut Seni Indonesia Yogyakarta
          </p>
          <h1
            className="font-serif text-[6rem] md:text-[10rem] lg:text-[12rem] text-white leading-[0.9] tracking-tight flex flex-col"
          >
            {disableEntranceEffects ? (
              <span className="inline-flex whitespace-nowrap">HIMA</span>
            ) : (
              <BlurText text="HIMA" className="inline-flex" animateBy="letters" />
            )}
            <div className="italic text-stone-700/50 font-light min-h-[1em] relative w-full overflow-visible isolate">
              {disablePressureEffect ? (
                <span className="inline-block whitespace-nowrap">MUSIK</span>
              ) : musikPressureActive ? (
                <TextPressure
                  text="MUSIK"
                  fontFamily="var(--font-serif)"
                  fontUrl=""
                  width={false}
                  textColor="currentColor"
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
                  className="inline-flex"
                  animateBy="letters"
                  onAnimationComplete={() => setMusikPressureActive(true)}
                />
              )}
            </div>
          </h1>
          <div
            ref={heroCtaRef}
            className="mt-16 md:mt-24 flex flex-col md:flex-row gap-10 items-start md:items-center"
          >
            <Link
              href="/about"
              className={`btn-primary shrink-0 ${!disableEntranceEffects ? 'opacity-0' : ''}`}
            >
              <span className="btn-primary-label">Tentang Kami</span>
              <div className="btn-primary-overlay"></div>
            </Link>
            <p className={`max-w-md text-neutral-400 text-sm leading-relaxed border-t md:border-t-0 md:border-l border-gold-500/30 pt-8 md:pt-0 md:pl-8 font-light ${!disableEntranceEffects ? 'opacity-0' : ''}`}>
              Harmony in diversity, rhythm in unity. Membangun ekosistem
              akademik yang inklusif dan progresif.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links / Featured */}
      <section className="py-24 px-6 bg-stone-950">
        <div
          ref={quickLinksRef}
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-stone-800 border-t border-b border-stone-800"
        >
          <Link
            href="/about"
            data-quick-link="true"
            className={`p-12 hover:bg-stone-900 transition-colors cursor-pointer group block ${!disableEntranceEffects ? 'opacity-0' : ''}`}
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
            data-quick-link="true"
            className={`p-12 hover:bg-stone-900 transition-colors cursor-pointer group block ${!disableEntranceEffects ? 'opacity-0' : ''}`}
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
            data-quick-link="true"
            className={`p-12 hover:bg-stone-900 transition-colors cursor-pointer group block ${!disableEntranceEffects ? 'opacity-0' : ''}`}
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
