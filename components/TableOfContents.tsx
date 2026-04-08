"use client";

import React, { useEffect, useRef, useState } from "react";

import type { TocItem } from "@/components/NotionRenderer";

interface TableOfContentsProps {
  headings: TocItem[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const manualActiveIdRef = useRef<string | null>(null);
  const manualActiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (headings.length === 0) return;

    const updateActiveHeading = () => {
      if (manualActiveIdRef.current) return;

      const viewportAnchor = 112;
      const bottomGrace = window.innerHeight * 0.35;
      const documentBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - bottomGrace;

      if (documentBottom) {
        const lastAutoIndex =
          headings.length > 1 ? headings.length - 2 : headings.length - 1;

        for (let index = lastAutoIndex; index >= 0; index -= 1) {
          const element = document.getElementById(headings[index].id);
          if (!element) continue;

          if (element.getBoundingClientRect().top <= window.innerHeight) {
            setActiveId(headings[index].id);
            return;
          }
        }
      }

      let currentId = headings[0]?.id ?? "";

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) continue;

        if (element.getBoundingClientRect().top - viewportAnchor <= 0) {
          currentId = heading.id;
        } else {
          break;
        }
      }

      setActiveId(currentId);
    };

    const callback = (entries: IntersectionObserverEntry[]) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        updateActiveHeading();
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "-80px 0px -70% 0px",
      threshold: 0.1,
    });

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) {
        observerRef.current.observe(element);
      }
    }

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
      if (manualActiveTimeoutRef.current) {
        clearTimeout(manualActiveTimeoutRef.current);
      }
    };
  }, [headings]);

  useEffect(() => {
    const navElement = navRef.current;
    const contentElement = contentRef.current;
    if (!navElement) return;

    const updateOverflowState = () => {
      setIsOverflowing(navElement.scrollHeight > navElement.clientHeight + 1);
    };

    updateOverflowState();

    const resizeObserver = new ResizeObserver(() => {
      updateOverflowState();
    });

    resizeObserver.observe(navElement);
    if (contentElement) {
      resizeObserver.observe(contentElement);
    }
    window.addEventListener("resize", updateOverflowState);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflowState);
    };
  }, [headings]);

  useEffect(() => {
    if (!activeId || !isOverflowing) return;

    const navElement = navRef.current;
    const activeElement = itemRefs.current[activeId];
    if (!navElement || !activeElement) return;

    const navRect = navElement.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();
    const currentScrollTop = navElement.scrollTop;
    const activeCenter =
      currentScrollTop + (activeRect.top - navRect.top) + activeRect.height / 2;
    const targetCenter = navElement.clientHeight / 2;
    const maxScrollTop = navElement.scrollHeight - navElement.clientHeight;
    const targetScrollTop = Math.max(
      0,
      Math.min(maxScrollTop, activeCenter - targetCenter),
    );

    navElement.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }, [activeId, isOverflowing]);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    if (manualActiveTimeoutRef.current) {
      clearTimeout(manualActiveTimeoutRef.current);
    }

    manualActiveIdRef.current = id;
    setActiveId(id);
    manualActiveTimeoutRef.current = setTimeout(() => {
      manualActiveIdRef.current = null;
    }, 1200);

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      ref={navRef}
      className={`sticky top-30 hidden max-h-[calc(100vh-9.5rem)] xl:block ${
        isOverflowing
          ? "overflow-y-auto overscroll-contain pr-1"
          : "overflow-visible"
      }`}
    >
      <h4 className="mb-4 text-xs font-semibold tracking-[0.3em] text-stone-500 uppercase">
        Daftar Isi
      </h4>
      <div ref={contentRef} className="space-y-1 border-l border-stone-800">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          const indent =
            heading.level === 1
              ? "pl-3"
              : heading.level === 2
                ? "pl-6"
                : heading.level === 3
                  ? "pl-9"
                  : heading.level === 4
                    ? "pl-12"
                    : heading.level === 5
                      ? "pl-14"
                      : "pl-16";

          return (
            <button
              key={heading.blockId}
              ref={(element) => {
                itemRefs.current[heading.id] = element;
              }}
              onClick={() => handleClick(heading.id)}
              className={`block w-full text-left text-sm transition-all duration-200 ${indent} ${
                isActive
                  ? "border-gold-500 text-gold-300 -ml-px border-l-2 font-medium"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <span className="block py-1">{heading.text}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
