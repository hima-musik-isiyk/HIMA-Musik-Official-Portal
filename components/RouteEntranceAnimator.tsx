"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useRef } from "react";

import { gsap } from "@/lib/gsap";
import { shouldRunViewEntrance } from "@/lib/view-entrance";

type RouteEntranceAnimatorProps = {
  children: React.ReactNode;
};

const shouldSkipAutoRouteAnimation = (pathname: string) => {
  // Every route under these prefixes has its own custom GSAP entrance.
  // RouteEntranceAnimator only covers future routes that lack one.
  if (pathname === "/") return true;
  const manualPrefixes = [
    "/about",
    "/events",
    "/gallery",
    "/aduan",
    "/pendaftaran",
    "/sekretariat",
  ];
  return manualPrefixes.some((prefix) => pathname.startsWith(prefix));
};

const isDecorativeNode = (element: HTMLElement) => {
  const className = element.className;
  if (typeof className !== "string") return false;
  return (
    className.includes("absolute") ||
    className.includes("pointer-events-none") ||
    className.includes("sr-only")
  );
};

export default function RouteEntranceAnimator({
  children,
}: RouteEntranceAnimatorProps) {
  const pathname = usePathname() ?? "/";
  const scopeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scopeRef.current) return;
    if (shouldSkipAutoRouteAnimation(pathname)) return;
    if (!shouldRunViewEntrance(pathname)) return;

    const routeRoot = scopeRef.current.firstElementChild as HTMLElement | null;
    if (!routeRoot) return;

    const levelOne = Array.from(routeRoot.children) as HTMLElement[];
    const levelTwo = levelOne.flatMap((child) =>
      Array.from(child.children),
    ) as HTMLElement[];

    const uniqueTargets = Array.from(new Set([...levelOne, ...levelTwo]));
    const targets = uniqueTargets.filter(
      (element) => !isDecorativeNode(element),
    );

    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.06,
          clearProps: "opacity,visibility,transform",
        },
      );
    }, scopeRef);

    return () => ctx.revert();
  }, [pathname]);

  return <div ref={scopeRef}>{children}</div>;
}
