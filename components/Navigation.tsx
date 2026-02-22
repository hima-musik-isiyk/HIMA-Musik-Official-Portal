"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import LogoHima from "./LogoHima";

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState<number | null>(null);
  const [mobileMenuLayer, setMobileMenuLayer] = useState(40);
  const [circleLayers, setCircleLayers] = useState({ base: 42, top: 44 });
  const [navLayer, setNavLayer] = useState(50);
  const navBarRef = useRef<HTMLElement | null>(null);
  const desktopLinkRefs = useRef<HTMLAnchorElement[]>([]);
  const mobileLinkRefs = useRef<HTMLAnchorElement[]>([]);
  const mobileRippleRefs = useRef<HTMLSpanElement[]>([]);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const fullscreenCircleBaseRef = useRef<HTMLDivElement | null>(null);
  const fullscreenCircleTopRef = useRef<HTMLDivElement | null>(null);
  const isNavigatingRef = useRef(false);
  const menuLayerCounterRef = useRef(40);
  const mobileMenuTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const mobileMenuAnimationIdRef = useRef(0);
  const menuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    if (mobileMenuTimelineRef.current) {
      mobileMenuTimelineRef.current.kill();
      mobileMenuTimelineRef.current = null;
    }

    const animationId = ++mobileMenuAnimationIdRef.current;

    const activeMobileLinks = mobileLinkRefs.current.filter(Boolean);
    const clickedMobileLink = activeMobileIndex !== null
      ? mobileLinkRefs.current[activeMobileIndex]
      : null;
    const nonClickedMobileLinks = clickedMobileLink
      ? activeMobileLinks.filter((link) => link !== clickedMobileLink)
      : activeMobileLinks;

    if (reduceMotion) {
      gsap.set(mobileMenuRef.current, isMenuOpen
        ? { yPercent: 0, autoAlpha: 1 }
        : { yPercent: -100, autoAlpha: 0 }
      );
      return;
    }

    gsap.killTweensOf([mobileMenuRef.current, ...activeMobileLinks]);

    if (isMenuOpen) {
      gsap.set(mobileMenuRef.current, { autoAlpha: 1 });

      const openTimeline = gsap.timeline();
      mobileMenuTimelineRef.current = openTimeline;

      openTimeline
        .to(mobileMenuRef.current, {
          yPercent: 0,
          duration: 0.2,
          ease: "power2.out",
        })
        .fromTo(
          activeMobileLinks,
          { y: 6, opacity: 1 },
          {
            y: 0,
            duration: 0.16,
            stagger: 0.015,
            ease: "power2.out",
            clearProps: "transform",
          },
          "<"
        );

      return;
    }

    const closeTimeline = gsap.timeline({
      onComplete: () => {
        if (animationId !== mobileMenuAnimationIdRef.current) {
          return;
        }
        isNavigatingRef.current = false;
        setIsNavigating(false);
        setActiveMobileIndex(null);
      },
    });

    mobileMenuTimelineRef.current = closeTimeline;

    if (isNavigatingRef.current) {
      closeTimeline
        .to(nonClickedMobileLinks, {
          opacity: 0,
          duration: 0.16,
          stagger: 0.01,
          ease: "power1.out",
        }, 0);

      if (clickedMobileLink) {
        closeTimeline.to(clickedMobileLink, {
          opacity: 0,
          duration: 0.7,
          ease: "power1.out",
        }, 0.06);
      }

      closeTimeline
        .to(mobileMenuRef.current, {
          autoAlpha: 0,
          duration: 0.8,
          ease: "power2.inOut",
          delay: 0.28,
        }, 0)
        .set(mobileMenuRef.current, { yPercent: -100 });
    } else {
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
    }
  }, [activeMobileIndex, isMenuOpen]);

  const clearMenuCloseTimeout = () => {
    if (menuCloseTimeoutRef.current) {
      clearTimeout(menuCloseTimeoutRef.current);
      menuCloseTimeoutRef.current = null;
    }
  };

  const bumpLayerStack = (mode: "menu-open" | "nav-transition") => {
    menuLayerCounterRef.current += 3;
    const nextMenuLayer = menuLayerCounterRef.current;

    if (mode === "menu-open") {
      setCircleLayers({
        base: nextMenuLayer,
        top: nextMenuLayer + 1,
      });
      setMobileMenuLayer(nextMenuLayer + 2);
    } else {
      setCircleLayers({
        base: nextMenuLayer,
        top: nextMenuLayer + 1,
      });
      setMobileMenuLayer(nextMenuLayer + 2);
    }

    setNavLayer(nextMenuLayer + 10);
  };

  const handleMenuToggle = () => {
    clearMenuCloseTimeout();

    setIsMenuOpen((previous) => {
      const next = !previous;

      if (next) {
        bumpLayerStack("menu-open");
        isNavigatingRef.current = false;
        setIsNavigating(false);
        setActiveMobileIndex(null);
      }

      return next;
    });
  };

  useEffect(() => {
    return () => {
      clearMenuCloseTimeout();
      if (mobileMenuTimelineRef.current) {
        mobileMenuTimelineRef.current.kill();
      }
    };
  }, []);

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

  const setMobileRippleRef = (element: HTMLSpanElement | null, index: number) => {
    if (!element) {
      return;
    }
    mobileRippleRefs.current[index] = element;
  };

  const animateMobileRipple = (index: number) => {
    if (typeof window === "undefined") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }

    const ripple = mobileRippleRefs.current[index];
    if (!ripple) {
      return;
    }

    gsap.killTweensOf(ripple);

    gsap.fromTo(
      ripple,
      { scale: 0, autoAlpha: 0.6 },
      {
        scale: 2.2,
        autoAlpha: 0,
        duration: 0.45,
        ease: "power2.out",
        clearProps: "transform,opacity",
      },
    );
  };

  const animateFullscreenCircle = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }

    const circleBase = fullscreenCircleBaseRef.current;
    const circleTop = fullscreenCircleTopRef.current;
    if (!circleBase || !circleTop) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const maxDistance = Math.max(
      Math.hypot(x, y),
      Math.hypot(window.innerWidth - x, y),
      Math.hypot(x, window.innerHeight - y),
      Math.hypot(window.innerWidth - x, window.innerHeight - y)
    );

    const diameter = maxDistance * 2;

    gsap.killTweensOf([circleBase, circleTop]);

    gsap.set([circleBase, circleTop], {
      left: x,
      top: y,
      width: 0,
      height: 0,
      opacity: 1,
      xPercent: -50,
      yPercent: -50,
    });

    const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
    timeline
      .to(circleBase, {
        width: diameter,
        height: diameter,
        duration: 1.2,
      }, 0)
      .to(circleTop, {
        width: diameter,
        height: diameter,
        duration: 1.2,
      }, 0)
      .to(circleTop, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      }, 0.18)
      .to(circleBase, {
        opacity: 0,
        duration: 3.4,
        ease: "expo.out",
      }, 0.4)
      .set([circleBase, circleTop], { width: 0, height: 0, opacity: 0 });
  };

  const handleNavItemClick = (href: string, index: number, event: React.MouseEvent<HTMLAnchorElement>) => {
    clearMenuCloseTimeout();
    bumpLayerStack("nav-transition");
    isNavigatingRef.current = true;
    setIsNavigating(true);
    setActiveMobileIndex(index);
    animateFullscreenCircle(event);
    if (href === "/" && typeof window !== "undefined") {
      window.sessionStorage.setItem("skipHomeGsapOnce", "true");
    }
    menuCloseTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 100);
  };

  return (
    <>
      <div
        ref={fullscreenCircleBaseRef}
        className="pointer-events-none fixed rounded-full bg-gold-500 opacity-0 z-[2]"
        style={{ zIndex: circleLayers.base }}
      />
      <div
        ref={fullscreenCircleTopRef}
        className="pointer-events-none fixed rounded-full bg-gold-500 opacity-0 z-[4]"
        style={{ zIndex: circleLayers.top }}
      />

      <nav ref={navBarRef} style={{ zIndex: navLayer }} className={`fixed top-0 left-0 w-full transition-all duration-500 ${
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
                  onClick={(e) => {
                    if (item.href === "/" && typeof window !== "undefined") {
                      window.sessionStorage.setItem("skipHomeGsapOnce", "true");
                    }
                  }}
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
            onClick={handleMenuToggle}
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
        style={{ zIndex: mobileMenuLayer }}
        className={`md:hidden fixed inset-0 will-change-transform ${
          isNavigating ? "bg-transparent" : "bg-[#0a0a0a]"
        } ${isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="h-full flex flex-col justify-center items-center space-y-10 px-8 pt-24 relative z-10">
          {navItems.map((item, idx) => {
            const isActive =
              item.href === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.href);
            const isClicked = activeMobileIndex === idx && isNavigating;

            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(element) => setMobileLinkRef(element, idx)}
                onClick={(e) => {
                  animateMobileRipple(idx);
                  handleNavItemClick(item.href, idx, e);
                }}
                className={`relative overflow-hidden text-3xl font-serif italic transition-all duration-500 ${
                  isClicked
                    ? "text-white z-20"
                    : isActive
                      ? "text-gold-500"
                      : "text-neutral-300 hover:text-white"
                } ${activeMobileIndex === idx && !isClicked ? "bg-gold-500/20" : ""}`}
              >
                <span className="relative z-10">{item.label}</span>
                <span
                  ref={(element) => setMobileRippleRef(element, idx)}
                  className="pointer-events-none absolute inset-0 rounded-full bg-gold-500/20 opacity-0 scale-0"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navigation;
