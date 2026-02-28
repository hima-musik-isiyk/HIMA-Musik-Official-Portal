"use client";

import React, { useEffect, useRef } from "react";

import { gsap } from "@/lib/gsap";
import { shouldRunViewEntrance } from "@/lib/view-entrance";

const Events: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    if (!shouldRunViewEntrance("/events")) return;

    const ctx = gsap.context(() => {
      const defaults = { ease: "power3.out", duration: 0.8 };

      gsap.fromTo(
        ".events-eyebrow",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, ...defaults },
      );

      gsap.fromTo(
        ".events-title",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, ...defaults, delay: 0.1 },
      );

      gsap.fromTo(
        ".events-subtitle",
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.2 },
      );

      gsap.fromTo(
        ".events-card",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, ...defaults, delay: 0.3 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);
  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-x-hidden px-6 pt-40 pb-32"
    >
      <div className="pointer-events-none absolute inset-0 w-full bg-[radial-gradient(circle_at_top_left,rgba(212,166,77,0.03)_0%,transparent_70%)]"></div>
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="relative mb-20 flex flex-col items-start justify-between border-b border-white/5 pb-10 md:flex-row md:items-end">
          <div className="bg-gold-500/50 absolute bottom-0 left-0 h-px w-32"></div>
          <div>
            <div className="events-eyebrow mb-6 flex items-center gap-4">
              <span
                className="bg-gold-500/40 block h-px w-8 md:w-12"
                aria-hidden="true"
              />
              <p className="text-gold-500 text-sm font-medium">Agenda</p>
            </div>
            <h1 className="events-title font-serif text-5xl tracking-tight text-white md:text-7xl">
              Kalender{" "}
              <span className="text-gold-500/80 font-light italic">Acara</span>
            </h1>
          </div>
          <p className="events-subtitle mt-8 text-sm text-neutral-400 md:mt-0">
            Semester Genap 2026
          </p>
        </div>

        <div className="space-y-0">
          <div className="events-card group hover:border-gold-500/30 relative overflow-hidden rounded-none border border-white/5 bg-white/1 px-8 py-24 text-center transition-colors duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,166,77,0.05)_0%,transparent_50%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <p className="text-sm tracking-wide text-neutral-400">
                Kalender acara Semester Genap 2026 sedang dalam penyusunan dan
                akan dipublikasikan sebelum perkuliahan dimulai.
              </p>
              <p className="text-sm text-neutral-500">
                Sementara itu, ikuti informasi terbaru melalui kanal resmi kami:
              </p>
              <a
                href="https://instagram.com/himamusikisi"
                target="_blank"
                rel="noreferrer"
                className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 inline-flex items-center gap-3 border px-6 py-3 text-sm font-medium transition-colors duration-300"
                style={{ borderRadius: "var(--radius-action)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1.5"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
                Ikuti @himamusikisi
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
