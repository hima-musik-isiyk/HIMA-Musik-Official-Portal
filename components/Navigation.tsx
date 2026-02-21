"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import LogoHima from "./LogoHima";

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const navBarRef = useRef<HTMLElement | null>(null);
  const desktopLinkRefs = useRef<HTMLAnchorElement[]>([]);
  const mobileLinkRefs = useRef<HTMLAnchorElement[]>([]);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const currentPath = pathname ?? "/";

  const navItems = [
    { href: "/", label: "Beranda" },
    { href: "/about", label: "Tentang" },
    { href: "/events", label: "Acara" },
    { href: "/gallery", label: "Galeri" },
    { href: "/aduan", label: "Aduan" },
  ];

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

      if (navBarRef.current) {
        timeline.from(navBarRef.current, {
          y: -14,
          opacity: 0,
          duration: 0.5,
        });
      }

      if (mobileMenuRef.current) {
        gsap.set(mobileMenuRef.current, {
          yPercent: -100,
          autoAlpha: 0,
          pointerEvents: "none",
        });
      }
    });

    return () => {
      context.revert();
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mobileMenuRef.current) {
      return;
    }

    const activeMobileLinks = mobileLinkRefs.current.filter(Boolean);

    if (reduceMotion) {
      gsap.set(mobileMenuRef.current, isMenuOpen
        ? { yPercent: 0, autoAlpha: 1, pointerEvents: "auto" }
        : { yPercent: -100, autoAlpha: 0, pointerEvents: "none" }
      );
      return;
    }

    gsap.killTweensOf([mobileMenuRef.current, ...activeMobileLinks]);

    if (isMenuOpen) {
      gsap.set(mobileMenuRef.current, { pointerEvents: "auto" });

      const openTimeline = gsap.timeline();
      openTimeline
        .to(mobileMenuRef.current, {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.42,
          ease: "power3.out",
        })
        .fromTo(
          activeMobileLinks,
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.28,
            stagger: 0.025,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
          "<0.08"
        );

      return;
    }

    const closeTimeline = gsap.timeline({
      onComplete: () => {
        if (mobileMenuRef.current) {
          gsap.set(mobileMenuRef.current, { pointerEvents: "none" });
        }
      },
    });
    closeTimeline
      .to(activeMobileLinks, {
        y: 6,
        opacity: 0,
        duration: 0.16,
        stagger: 0.015,
        ease: "power1.in",
      })
      .to(mobileMenuRef.current, {
        yPercent: -100,
        autoAlpha: 0,
        duration: 0.32,
        ease: "power2.inOut",
      }, "<0.02");
  }, [isMenuOpen]);

  const setDesktopLinkRef = (element: HTMLAnchorElement | null, index: number) => {
    if (!element) {
      return;
    }
    desktopLinkRefs.current[index] = element;
  };

  const setMobileLinkRef = (element: HTMLAnchorElement | null, index: number) => {
    if (!element) {
      return;
    }
    mobileLinkRefs.current[index] = element;
  };

  const handleNavItemClick = (href: string) => {
    if (href === "/" && typeof window !== "undefined") {
      window.sessionStorage.setItem("skipHomeGsapOnce", "true");
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav ref={navBarRef} className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isMenuOpen ? "bg-transparent border-transparent" : "bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between relative z-50">
          <Link
            href="/"
            className="cursor-pointer"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            onClick={() => setIsMenuOpen(false)}
          >
            <LogoHima
              lineColor={isLogoHovered ? "white" : "white"}
              glyphColor={isLogoHovered ? "white" : "var(--color-gold-500)"}
              textColor={isLogoHovered ? "white" : "white"}
              className="h-32 w-auto transition-colors duration-300"
            />
          </Link>

          <div className="hidden md:flex space-x-8">
            {navItems.map((item, index) => {
              const isActive =
                item.href === "/"
                  ? currentPath === "/"
                  : currentPath.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(element) => setDesktopLinkRef(element, index)}
                  onClick={() => handleNavItemClick(item.href)}
                  className={`text-sm uppercase tracking-[0.25em] font-medium transition-all duration-500 relative group opacity-100 ${
                    isActive
                      ? "text-gold-500"
                      : "text-neutral-300 hover:text-white"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-px bg-gold-500 transition-all duration-500 ${
                      isActive
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          <button
            className="md:hidden flex flex-col space-y-1.5 group relative z-50 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`h-px bg-neutral-300 transition-all duration-300 ${isMenuOpen ? "w-6 rotate-45 translate-y-[7px]" : "w-6"}`} />
            <span className={`h-px bg-neutral-300 transition-all duration-300 ${isMenuOpen ? "opacity-0" : "w-4"}`} />
            <span className={`h-px bg-neutral-300 transition-all duration-300 ${isMenuOpen ? "w-6 -rotate-45 -translate-y-[7px]" : "w-6"}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className="md:hidden fixed inset-0 bg-[#0a0a0a] z-40 will-change-transform"
      >
        <div className="h-full flex flex-col justify-center items-center space-y-10 px-8 pt-24">
          {navItems.map((item, idx) => {
            const isActive =
              item.href === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(element) => setMobileLinkRef(element, idx)}
                onClick={() => handleNavItemClick(item.href)}
                className={`text-3xl font-serif italic transition-all duration-500 ${
                  isActive
                    ? "text-gold-500"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navigation;
