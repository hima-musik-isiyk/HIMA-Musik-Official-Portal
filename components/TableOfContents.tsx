"use client";

import React, { useEffect, useRef, useState } from "react";

import type { TocItem } from "@/components/NotionRenderer";

interface TableOfContentsProps {
  headings: TocItem[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const callback = (entries: IntersectionObserverEntry[]) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        setActiveId(visibleEntries[0].target.id);
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

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto xl:block">
      <h4 className="mb-4 text-xs font-semibold tracking-[0.3em] text-stone-500 uppercase">
        Daftar Isi
      </h4>
      <div className="space-y-1 border-l border-stone-800">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          const indent =
            heading.level === 1
              ? "pl-3"
              : heading.level === 2
                ? "pl-6"
                : "pl-9";

          return (
            <button
              key={heading.id}
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
