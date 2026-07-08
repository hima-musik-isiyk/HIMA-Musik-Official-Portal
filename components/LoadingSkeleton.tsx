"use client";

import React from "react";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function LoadingSkeleton({
  className,
  shimmer = true,
  ...props
}: LoadingSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden bg-white/[0.055]",
        shimmer &&
          "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <LoadingSkeleton
          key={index}
          className="h-12 rounded-[var(--radius-action)] border border-white/5"
        />
      ))}
    </div>
  );
}
