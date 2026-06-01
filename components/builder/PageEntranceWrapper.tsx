"use client";

import React from "react";

import useViewEntrance from "@/lib/useViewEntrance";

interface PageEntranceWrapperProps {
  slug?: string;
  route?: string;
  children: React.ReactNode;
}

export default function PageEntranceWrapper({
  slug,
  route,
  children,
}: PageEntranceWrapperProps) {
  const scopeRef = useViewEntrance(slug || route || "/");

  return (
    <div ref={scopeRef} className="h-full w-full">
      {children}
    </div>
  );
}
