"use client";

import Link from "next/link";
import React from "react";

interface GenericButtonSpanProps {
  value1: string; // Title
  value2: string; // Detail/Description
  value3?: string; // Raw CMS link target (page/section name)
  href?: string; // Resolved path from Master Page / Section slug
  groupId?: string;
  className?: string;
}

export const GenericButtonSpan: React.FC<GenericButtonSpanProps> = ({
  value1,
  value2,
  href,
  className = "",
}) => {
  const linkHref = href?.trim() || "";

  const inner = (
    <>
      <div>
        <h3 className="mb-3 font-serif text-xl text-stone-300 transition-colors duration-300 group-hover:text-white md:text-2xl">
          {value1}
        </h3>
        {value2 && (
          <p className="text-[0.8125rem] leading-relaxed text-stone-600 transition-colors duration-300 group-hover:text-stone-400">
            {value2}
          </p>
        )}
      </div>
      {linkHref && (
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
            aria-hidden
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </>
  );

  if (linkHref) {
    return (
      <Link
        href={linkHref}
        data-animate="up"
        className={`group relative flex cursor-pointer flex-col justify-between p-10 transition-colors duration-300 hover:bg-stone-900/50 md:p-12 ${className}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      data-animate="up"
      className={`flex items-start gap-6 border border-white/5 bg-white/2 p-6 md:p-8 ${className}`}
    >
      <div>
        <h3 className="mb-2 font-serif text-xl text-white">{value1}</h3>
        {value2 && (
          <p className="text-sm leading-relaxed text-neutral-400">{value2}</p>
        )}
      </div>
    </div>
  );
};
