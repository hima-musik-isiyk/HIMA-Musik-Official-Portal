"use client";

import React from "react";

interface GenericTitleProps {
  value1?: string; // The full text
  value2?: string; // The split word index (e.g. "1", "2") to italicize
  variation?: string; // "Big", "Medium", etc.
  variation1?: string;
  className?: string;
}

export const GenericTitle: React.FC<GenericTitleProps> = ({
  value1 = "",
  value2 = "",
  variation: variationProp,
  variation1,
  className = "",
}) => {
  const variation = variationProp ?? variation1 ?? "";
  // Parsing the word split
  const splitIndex = parseInt(value2, 10);
  let content: React.ReactNode = value1;

  if (
    !isNaN(splitIndex) &&
    splitIndex > 0 &&
    splitIndex < value1.split(" ").length
  ) {
    const words = value1.split(" ");
    const partA = words.slice(0, splitIndex).join(" ");
    const partB = words.slice(splitIndex).join(" ");

    content = (
      <>
        {partA && `${partA} `}
        <span className="text-gold-500/80 font-light italic">{partB}</span>
      </>
    );
  }

  if (variation === "1" || variation.toLowerCase() === "big") {
    return (
      <h1
        data-animate="up"
        className={`font-serif text-4xl tracking-tight text-white md:text-6xl lg:text-7xl ${className}`}
      >
        {content}
      </h1>
    );
  }

  if (variation === "2" || variation.toLowerCase() === "medium") {
    return (
      <h2
        data-animate="up"
        className={`font-serif text-3xl tracking-tight text-white md:text-5xl ${className}`}
      >
        {content}
      </h2>
    );
  }

  // Fallback
  return (
    <h2
      data-animate="up"
      className={`font-serif text-2xl tracking-tight text-white md:text-4xl ${className}`}
    >
      {content}
    </h2>
  );
};
