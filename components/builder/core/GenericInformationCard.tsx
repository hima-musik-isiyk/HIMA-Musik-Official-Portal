"use client";

import Link from "next/link";
import React from "react";

interface GenericInformationCardProps {
  value1?: string;
  value2?: string;
  value3?: string;
  href?: string;
  variation1?: string;
  className?: string;
}

export const GenericInformationCard: React.FC<GenericInformationCardProps> = ({
  value1 = "",
  value2 = "",
  value3 = "",
  href,
  variation1 = "",
  className = "",
}) => {
  if (!value1 && !value2 && !value3) return null;

  const alignCenter =
    variation1 === "2" || variation1.toLowerCase().includes("center");
  const content = (
    <article
      data-animate="up"
      className={`hover:border-gold-500/40 border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors ${alignCenter ? "text-center" : "text-left"} ${className}`}
    >
      {value1 && (
        <h3 className="font-serif text-2xl tracking-tight text-white">
          {value1}
        </h3>
      )}
      {value2 && (
        <p className="mt-3 text-sm leading-7 text-stone-400">{value2}</p>
      )}
      {value3 && !href && (
        <p className="text-gold-500/80 mt-5 text-xs font-medium tracking-[0.25em] uppercase">
          {value3}
        </p>
      )}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
