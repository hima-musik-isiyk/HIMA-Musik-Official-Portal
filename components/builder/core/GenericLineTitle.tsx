"use client";

import React from "react";

interface GenericLineTitleProps {
  value1: string;
  variation1?: string;
  className?: string;
}

const AccentLine = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className = "", ...props }, ref) => (
  <span
    ref={ref}
    className={`bg-gold-500/40 block h-px w-8 md:w-12 ${className}`}
    aria-hidden="true"
    {...props}
  />
));
AccentLine.displayName = "AccentLine";

export const GenericLineTitle: React.FC<GenericLineTitleProps> = ({
  value1,
  variation1 = "Left",
  className = "",
}) => {
  const alignment = variation1?.toLowerCase() || "left";

  if (alignment === "center" || variation1 === "2") {
    return (
      <div
        className={`mb-6 flex items-center justify-center gap-4 ${className}`}
      >
        <AccentLine data-animate="right" />
        <p
          data-animate="up"
          className="text-gold-500 text-center text-[0.65rem] font-medium tracking-[0.4em] uppercase"
        >
          {value1}
        </p>
        <AccentLine data-animate="right" />
      </div>
    );
  }

  // Left aligned by default
  return (
    <div className={`mb-6 flex items-center gap-4 ${className}`}>
      <AccentLine data-animate="right" />
      <p
        data-animate="up"
        className="text-[0.65rem] font-medium tracking-[0.4em] text-stone-600 uppercase"
      >
        {value1}
      </p>
    </div>
  );
};
