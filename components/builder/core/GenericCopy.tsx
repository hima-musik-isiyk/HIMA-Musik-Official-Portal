"use client";

import React from "react";

interface GenericCopyProps {
  value1?: string;
  className?: string;
}

export const GenericCopy: React.FC<GenericCopyProps> = ({
  value1 = "",
  className = "",
}) => {
  if (!value1) return null;

  return (
    <p
      data-animate="up"
      className={`text-center text-sm text-stone-500 ${className}`}
    >
      {value1}
    </p>
  );
};
