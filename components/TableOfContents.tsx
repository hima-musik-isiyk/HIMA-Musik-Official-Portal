"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import type { TocItem } from "@/components/NotionRenderer";

interface TableOfContentsProps {
  headings: TocItem[];
}

/* ------------------------------------------------------------------ */
/*  Compute the ancestor chain for the active heading (VS Code style) */
/* ------------------------------------------------------------------ */

function computeStickyAncestors(
  headings: TocItem[],
  activeId: string,
): TocItem[] {
  const activeIndex = headings.findIndex((h) => h.id === activeId);
  if (activeIndex <= 0) return [];

  const activeLevel = headings[activeIndex].level;
  if (activeLevel <= 1) return [];

  const ancestors: TocItem[] = [];
  const needed = new Set<number>();
  for (let l = 1; l < activeLevel; l++) needed.add(l);

  for (let i = activeIndex - 1; i >= 0 && needed.size > 0; i--) {
    const h = headings[i];
    if (needed.has(h.level)) {
      ancestors.unshift(h);
      needed.delete(h.level);
    }
  }

  return ancestors;
}

/* ------------------------------------------------------------------ */
/*  Indent helper                                                      */
/* ------------------------------------------------------------------ */

const INDENT: Record<number, string> = {
  1: "pl-3",
  2: "pl-6",
  3: "pl-9",
  4: "pl-12",
  5: "pl-14",
  6: "pl-16",
};

function getIndent(level: number) {
  return INDENT[level] ?? "pl-16";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null); // scrollable list
  const contentRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null); // breadcrumb overlay
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const manualActiveIdRef = useRef<string | null>(null);
  const manualActiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  /* ---- Active heading detection (unchanged logic) ---- */
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

  /* ---- Overflow detection ---- */
  useEffect(() => {
    const scrollElement = scrollRef.current;
    const contentElement = contentRef.current;
    if (!scrollElement) return;

    const updateOverflowState = () => {
      setIsOverflowing(
        scrollElement.scrollHeight > scrollElement.clientHeight + 1,
      );
    };

    updateOverflowState();

    const resizeObserver = new ResizeObserver(() => {
      updateOverflowState();
    });

    resizeObserver.observe(scrollElement);
    if (contentElement) {
      resizeObserver.observe(contentElement);
    }
    window.addEventListener("resize", updateOverflowState);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflowState);
    };
  }, [headings]);

  /* ---- Compute sticky ancestors ---- */
  const stickyAncestors = useMemo(
    () => computeStickyAncestors(headings, activeId),
    [headings, activeId],
  );

  /* ---- Measure breadcrumb height for padding offset ---- */
  const [stickyHeight, setStickyHeight] = useState(0);
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) {
      setStickyHeight(0);
      return;
    }
    const ro = new ResizeObserver(() => {
      setStickyHeight(el.offsetHeight);
    });
    ro.observe(el);
    setStickyHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, [stickyAncestors.length]);

  /* ---- Auto-scroll active item into view ---- */
  useEffect(() => {
    if (!activeId || !isOverflowing) return;

    const scrollElement = scrollRef.current;
    const activeElement = itemRefs.current[activeId];
    if (!scrollElement || !activeElement) return;

    const scrollRect = scrollElement.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();
    const currentScrollTop = scrollElement.scrollTop;
    const activeTopInScroll =
      currentScrollTop + (activeRect.top - scrollRect.top);

    // We want the active item to be positioned just below the sticky breadcrumbs,
    // closing the gap and hiding the actual ancestors behind the sticky overlay
    const maxScrollTop =
      scrollElement.scrollHeight - scrollElement.clientHeight;
    const gap = 12; // slight padding below the sticky breadcrumbs
    const targetScrollTop = Math.max(
      0,
      Math.min(maxScrollTop, activeTopInScroll - stickyHeight - gap),
    );

    scrollElement.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }, [activeId, isOverflowing, stickyHeight]);

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

  const hasStickyScope = stickyAncestors.length > 0;

  return (
    <div
      className="sticky top-30 hidden max-h-[calc(100vh-9.5rem)] xl:block"
      style={{ position: "sticky" }}
    >
      <h4 className="mb-4 text-xs font-semibold tracking-[0.3em] text-stone-500 uppercase">
        Daftar Isi
      </h4>

      {/*
        VS Code-style overlay: absolutely positioned at the top of the
        relatively-positioned scroll container. Because the outer div is
        already `sticky` relative to the viewport, this overlay naturally
        stays pinned in view. No nested `position: sticky` needed.

        Like VS Code's `.sticky-widget`:
          - overflow: hidden
          - border-bottom
          - subtle box-shadow
      */}
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        {/* Breadcrumb overlay */}
        {hasStickyScope && (
          <div
            ref={stickyRef}
            className="absolute top-0 right-0 left-0 z-10 border-l border-stone-700/60 bg-stone-950/95 backdrop-blur-[2px]"
            style={{
              boxShadow: "0 3px 4px -2px rgba(0,0,0,0.35)",
            }}
          >
            {stickyAncestors.map((ancestor, idx) => (
              <button
                key={ancestor.blockId}
                onClick={() => handleClick(ancestor.id)}
                className={`block w-full text-left text-[13px] leading-snug transition-colors duration-150 ${getIndent(ancestor.level)} text-stone-500 hover:text-stone-300`}
                title={ancestor.text}
              >
                <span
                  className="block truncate py-[3px]"
                  style={{
                    opacity:
                      0.5 +
                      idx * (0.4 / Math.max(stickyAncestors.length - 1, 1)),
                  }}
                >
                  {ancestor.text}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Scrollable heading list */}
        <div
          ref={scrollRef}
          className={`max-h-[calc(100vh-12rem)] ${
            isOverflowing
              ? "overflow-y-auto overscroll-contain pr-1"
              : "overflow-visible"
          }`}
        >
          {/* Padding spacer so list items don't hide behind the overlay */}
          {hasStickyScope && (
            <div
              aria-hidden
              style={{ height: stickyHeight }}
              className="pointer-events-none shrink-0"
            />
          )}

          <div ref={contentRef} className="space-y-1 border-l border-stone-800">
            {headings.map((heading) => {
              const isActive = activeId === heading.id;
              const indent = getIndent(heading.level);

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
        </div>
      </div>
    </div>
  );
}
