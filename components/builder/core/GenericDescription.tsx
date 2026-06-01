"use client";

import React from "react";

interface GenericDescriptionProps {
  value1: string;
  className?: string;
}

export const GenericDescription: React.FC<GenericDescriptionProps> = ({
  value1,
  className = "",
}) => {
  return (
    <p
      data-animate="up"
      className={`text-base leading-relaxed text-neutral-400 ${className}`}
    >
      {value1}
    </p>
  );
};
