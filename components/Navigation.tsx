"use client";

import gsap from "gsap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

import LogoHima from "./LogoHima";

/* ------------------------------------------------------------------ */
/*  Menu data                                                          */
/* ------------------------------------------------------------------ */

interface DropdownItem {
  href: string;
  label: string;
  description: string;
  icon?: string;
}

interface NavGroup {
  label: string;
  href?: string;
  dropdown?: DropdownItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: "Profil", href: "/about" },
  {
    label: "Publikasi",
    dropdown: [
      {
        href: "/events",
        label: "Acara",
        description: "Kalender program & agenda kegiatan",
        icon: "calendar",
      },
      {
        href: "/gallery",
        label: "Galeri",
        description: "Arsip visual dokumentasi",
        icon: "gallery",
      },
    ],
  },
  {
    label: "Layanan",
    dropdown: [
      {
        href: "/docs",
        label: "Pusat Administrasi & Docs",
        description: "Portal dokumen, SOP & arsip organisasi",
        icon: "docs",
      },
      {
        href: "/aduan",
        label: "Ruang Advokasi",
        description: "Layanan aduan & aspirasi mahasiswa",
        icon: "advocacy",
      },
    ],
  },
];

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/about", label: "Profil" },
  { href: "/events", label: "Acara" },
  { href: "/gallery", label: "Galeri" },
  { href: "/docs", label: "Pusat Administrasi" },
  { href: "/aduan", label: "Ruang Advokasi" },
  { href: "/pendaftaran", label: "Open Recruitment" },
];

/* ------------------------------------------------------------------ */
/*  Dropdown icon map (SVG)                                            */
/* ------------------------------------------------------------------ */

const DROPDOWN_ICON_MAP: Record<string, React.ReactElement> = {
  calendar: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  gallery: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  docs: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  advocacy: (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState<number | null>(
    null,
  );
  const [isCompactMobileMenu, setIsCompactMobileMenu] = useState(false);
  const [mobileMenuLayer, setMobileMenuLayer] = useState(40);
  const [circleLayers, setCircleLayers] = useState({ base: 42, top: 44 });
  const [navLayer, setNavLayer] = useState(50);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navBarRef = useRef<HTMLElement | null>(null);
  const mobileLinkRefs = useRef<HTMLAnchorElement[]>([]);
  const mobileRippleRefs = useRef<HTMLSpanElement[]>([]);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const fullscreenCircleBaseRef = useRef<HTMLDivElement | null>(null);
  const fullscreenCircleTopRef = useRef<HTMLDivElement | null>(null);
  const isNavigatingRef = useRef(false);
  const menuLayerCounterRef = useRef(40);
  const mobileMenuTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const mobileMenuAnimationIdRef = useRef(0);
  const menuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pathname = usePathname();
  const currentPath = pathname ?? "/";

  /* ------ GSAP init ----- */
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

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
        gsap.set(mobileMenuRef.current, { yPercent: -100, autoAlpha: 0 });
      }
    });
    return () => context.revert();
  }, []);

  /* ------ Mobile menu open/close ----- */
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!mobileMenuRef.current) return;

    if (mobileMenuTimelineRef.current) {
      mobileMenuTimelineRef.current.kill();
      mobileMenuTimelineRef.current = null;
    }

    const animationId = ++mobileMenuAnimationIdRef.current;
    const activeMobileLinks = mobileLinkRefs.current.filter(Boolean);
    const clickedMobileLink =
      activeMobileIndex !== null
        ? mobileLinkRefs.current[activeMobileIndex]
        : null;
    const nonClickedMobileLinks = clickedMobileLink
      ? activeMobileLinks.filter((link) => link !== clickedMobileLink)
      : activeMobileLinks;

    if (reduceMotion) {
      gsap.set(
        mobileMenuRef.current,
        isMenuOpen
          ? { yPercent: 0, autoAlpha: 1 }
          : { yPercent: -100, autoAlpha: 0 },
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
          "<",
        );
      return;
    }

    const closeTimeline = gsap.timeline({
      onComplete: () => {
        if (animationId !== mobileMenuAnimationIdRef.current) return;
        isNavigatingRef.current = false;
        setIsNavigating(false);
        setActiveMobileIndex(null);
      },
    });
    mobileMenuTimelineRef.current = closeTimeline;

    if (isNavigatingRef.current) {
      closeTimeline.to(
        nonClickedMobileLinks,
        {
          opacity: 0,
          duration: 0.16,
          stagger: 0.01,
          ease: "power1.out",
        },
        0,
      );
      if (clickedMobileLink) {
        closeTimeline.to(
          clickedMobileLink,
          {
            opacity: 0,
            duration: 0.7,
            ease: "power1.out",
          },
          0.06,
        );
      }
      closeTimeline
        .to(
          mobileMenuRef.current,
          {
            autoAlpha: 0,
            duration: 0.8,
            ease: "power2.inOut",
            delay: 0.28,
          },
          0,
        )
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
        .to(
          mobileMenuRef.current,
          {
            yPercent: -100,
            autoAlpha: 0,
            duration: 0.32,
            ease: "power2.inOut",
          },
          "<0.02",
        );
    }
  }, [activeMobileIndex, isMenuOpen]);

  /* ------ Helpers ----- */
  const clearMenuCloseTimeout = () => {
    if (menuCloseTimeoutRef.current) {
      clearTimeout(menuCloseTimeoutRef.current);
      menuCloseTimeoutRef.current = null;
    }
  };

  const bumpLayerStack = (mode: "menu-open" | "nav-transition") => {
    menuLayerCounterRef.current += 3;
    const nextMenuLayer = menuLayerCounterRef.current;
    if (mode === "menu-open" || mode === "nav-transition") {
      setCircleLayers({ base: nextMenuLayer, top: nextMenuLayer + 1 });
      setMobileMenuLayer(nextMenuLayer + 2);
    }
    setNavLayer(nextMenuLayer + 10);
  };

  const handleMenuToggle = () => {
    clearMenuCloseTimeout();
    setIsMenuOpen((prev) => {
      const next = !prev;
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
      if (mobileMenuTimelineRef.current) mobileMenuTimelineRef.current.kill();
    };
  }, []);

  const setMobileLinkRef = (el: HTMLAnchorElement | null, index: number) => {
    if (!el) return;
    mobileLinkRefs.current[index] = el;
  };

  const setMobileRippleRef = (el: HTMLSpanElement | null, index: number) => {
    if (!el) return;
    mobileRippleRefs.current[index] = el;
  };

  const animateMobileRipple = (index: number) => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;
    const ripple = mobileRippleRefs.current[index];
    if (!ripple) return;
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

  const animateFullscreenCircle = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const circleBase = fullscreenCircleBaseRef.current;
    const circleTop = fullscreenCircleTopRef.current;
    if (!circleBase || !circleTop) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const maxDistance = Math.max(
      Math.hypot(x, y),
      Math.hypot(window.innerWidth - x, y),
      Math.hypot(x, window.innerHeight - y),
      Math.hypot(window.innerWidth - x, window.innerHeight - y),
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

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(circleBase, { width: diameter, height: diameter, duration: 1.2 }, 0)
      .to(circleTop, { width: diameter, height: diameter, duration: 1.2 }, 0)
      .to(circleTop, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0.18)
      .to(circleBase, { opacity: 0, duration: 3.4, ease: "expo.out" }, 0.4)
      .set([circleBase, circleTop], { width: 0, height: 0, opacity: 0 });
  };

  const handleNavItemClick = (
    href: string,
    index: number,
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
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

  const handleMobileMenuClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest("a");
    if (!anchor) setIsMenuOpen(false);
  };

  useEffect(() => {
    const updateCompactMobileMenu = () => {
      if (typeof window === "undefined") return;
      setIsCompactMobileMenu(window.innerHeight < 640);
    };
    updateCompactMobileMenu();
    window.addEventListener("resize", updateCompactMobileMenu);
    return () => window.removeEventListener("resize", updateCompactMobileMenu);
  }, []);

  /* ------ Dropdown hover with delay ----- */
  const handleDropdownEnter = useCallback((label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setOpenDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  }, []);

  /* Close dropdown on route change */
  useEffect(() => {
    setOpenDropdown(null);
  }, [currentPath]);

  /* ------ Active detection ----- */
  const isPathActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  const isGroupActive = (group: NavGroup) => {
    if (group.href) return isPathActive(group.href);
    if (group.dropdown) return group.dropdown.some((d) => isPathActive(d.href));
    return false;
  };

  return (
    <>
      {/* Fullscreen circle transition elements */}
      <div
        ref={fullscreenCircleBaseRef}
        className="bg-gold-500 pointer-events-none fixed z-2 rounded-full opacity-0"
        style={{ zIndex: circleLayers.base }}
      />
      <div
        ref={fullscreenCircleTopRef}
        className="bg-gold-500 pointer-events-none fixed z-4 rounded-full opacity-0"
        style={{ zIndex: circleLayers.top }}
      />

      {/* ====== NAVBAR ====== */}
      <nav
        ref={navBarRef}
        style={{ zIndex: navLayer }}
        className={`fixed top-0 left-0 w-full transition-all duration-500 ${
          isMenuOpen
            ? "border-transparent bg-transparent"
            : "border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl"
        }`}
      >
        <div className="relative z-50 mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* LEFT: Logo */}
          <Link
            href="/"
            className="cursor-pointer"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            onClick={() => {
              setIsMenuOpen(false);
              setOpenDropdown(null);
            }}
          >
            <LogoHima
              lineColor={isLogoHovered ? "white" : "white"}
              glyphColor={isLogoHovered ? "white" : "var(--color-gold-500)"}
              textColor={isLogoHovered ? "white" : "white"}
              className="h-32 w-auto transition-colors duration-300"
            />
          </Link>

          {/* CENTER: Desktop Mega-Menu */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_GROUPS.map((group) =>
              group.dropdown ? (
                <div
                  key={group.label}
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter(group.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className={`group relative px-4 py-2 text-sm font-medium tracking-[0.2em] uppercase transition-all duration-300 ${
                      isGroupActive(group)
                        ? "text-gold-500"
                        : "text-neutral-500 hover:text-white"
                    }`}
                    onClick={() =>
                      setOpenDropdown((prev) =>
                        prev === group.label ? null : group.label,
                      )
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      {group.label}
                      <svg
                        className={`h-3 w-3 transition-transform duration-200 ${
                          openDropdown === group.label ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                    <span
                      className={`bg-gold-500 absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 transition-all duration-500 ${
                        isGroupActive(group)
                          ? "w-3/4 opacity-100"
                          : "w-0 opacity-0"
                      }`}
                    />
                  </button>

                  {/* Dropdown pane */}
                  <div
                    className={`absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 transition-all duration-200 ${
                      openDropdown === group.label
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-2 opacity-0"
                    }`}
                  >
                    <div className="w-72 overflow-hidden rounded-xl border border-white/10 bg-stone-900/90 p-2 shadow-2xl backdrop-blur-xl">
                      {group.dropdown.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className={`group/item flex items-start gap-3 rounded-lg px-3 py-3 transition-all duration-200 ${
                            isPathActive(item.href)
                              ? "bg-gold-500/10 text-white"
                              : "text-neutral-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {item.icon && DROPDOWN_ICON_MAP[item.icon] && (
                            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-stone-700 bg-stone-800 text-stone-400">
                              {DROPDOWN_ICON_MAP[item.icon]}
                            </span>
                          )}
                          <div>
                            <div
                              className={`text-sm font-semibold tracking-wider ${
                                isPathActive(item.href)
                                  ? "text-gold-300"
                                  : "group-hover/item:text-white"
                              }`}
                            >
                              {item.label}
                            </div>
                            <div className="mt-0.5 text-xs leading-relaxed text-stone-500">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={group.label}
                  href={group.href!}
                  className={`group relative px-4 py-2 text-sm font-medium tracking-[0.2em] uppercase transition-all duration-500 ${
                    isGroupActive(group)
                      ? "text-gold-500"
                      : "text-neutral-500 hover:text-white"
                  }`}
                >
                  {group.label}
                  <span
                    className={`bg-gold-500 absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 transition-all duration-500 ${
                      isGroupActive(group)
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50"
                    }`}
                  />
                </Link>
              ),
            )}
          </div>

          {/* RIGHT: CTA + Search + Hamburger */}
          <div className="flex items-center gap-4">
            {/* Desktop CTA */}
            <Link
              href="/pendaftaran"
              className="border-gold-500/40 bg-gold-500/10 text-gold-300 hover:border-gold-500/60 hover:bg-gold-500/20 hover:text-gold-200 hidden rounded-lg border px-5 py-2 text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 md:inline-flex"
            >
              Open Recruitment
            </Link>

            {/* Search trigger */}
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true,
                });
                window.dispatchEvent(event);
              }}
              className="hidden items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/50 px-3 py-1.5 text-xs text-stone-500 transition-colors hover:border-stone-700 hover:text-stone-400 md:flex"
              aria-label="Pencarian"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <kbd className="font-mono text-[10px]">⌘K</kbd>
            </button>

            {/* Mobile hamburger */}
            <button
              className="group relative z-50 flex flex-col space-y-1.5 p-2 md:hidden"
              onClick={handleMenuToggle}
              aria-label="Toggle menu"
            >
              <span
                className={`h-px bg-neutral-300 transition-all duration-300 ${
                  isMenuOpen ? "w-6 translate-y-1.75 rotate-45" : "w-6"
                }`}
              />
              <span
                className={`h-px bg-neutral-300 transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : "w-4"
                }`}
              />
              <span
                className={`h-px bg-neutral-300 transition-all duration-300 ${
                  isMenuOpen ? "w-6 -translate-y-1.75 -rotate-45" : "w-6"
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* ====== MOBILE MENU ====== */}
      <div
        ref={mobileMenuRef}
        style={{ zIndex: mobileMenuLayer }}
        className={`fixed inset-0 flex flex-col pt-24 will-change-transform md:hidden ${
          isNavigating ? "bg-transparent" : "bg-[#0a0a0a]"
        } ${
          isMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={handleMobileMenuClick}
      >
        <div
          className={`relative z-10 flex flex-1 flex-col items-center px-8 ${
            isCompactMobileMenu
              ? "justify-start space-y-4 overflow-y-auto"
              : "justify-center space-y-8"
          }`}
        >
          {MOBILE_NAV_ITEMS.map((item, idx) => {
            const isActive = isPathActive(item.href);
            const isClicked = activeMobileIndex === idx && isNavigating;
            const isRecruitment = item.href === "/pendaftaran";

            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => setMobileLinkRef(el, idx)}
                onClick={(e) => {
                  animateMobileRipple(idx);
                  handleNavItemClick(item.href, idx, e);
                }}
                className={`relative font-serif italic transition-all duration-500 ${
                  isCompactMobileMenu ? "text-2xl" : "text-3xl"
                } ${
                  isRecruitment
                    ? "text-gold-400"
                    : isClicked
                      ? "z-20 text-white"
                      : isActive
                        ? "text-gold-500"
                        : "text-neutral-500 hover:text-white"
                } ${activeMobileIndex === idx && !isClicked ? "bg-gold-500/20" : ""}`}
              >
                <span className="relative z-10">{item.label}</span>
                <span
                  ref={(el) => setMobileRippleRef(el, idx)}
                  className="bg-gold-500/20 pointer-events-none absolute inset-0 scale-0 rounded-full opacity-0"
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
