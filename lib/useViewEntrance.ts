import { useRef } from "react";

import { gsap } from "@/lib/gsap";
import useIsomorphicLayoutEffect from "@/lib/useIsomorphicLayoutEffect";
import { shouldRunViewEntrance } from "@/lib/view-entrance";

/* ────────────────────────────────────────────────────────────────────
 *  Universal entrance animation system.
 *
 *  Usage:
 *    1. Call `useViewEntrance(pathname)` — returns a `scopeRef`.
 *    2. Attach `ref={scopeRef}` to the outermost wrapper.
 *    3. Mark any element with `data-animate="<variant>"`.
 *
 *  Variants:
 *    up      — y: 20   → 0  (default)
 *    down    — y: -20  → 0
 *    left    — x: 20   → 0
 *    right   — x: -20  → 0
 *    fade    — opacity only
 *    scale   — scale: 0.97 → 1
 *    scale-x — scaleX: 0  → 1
 *
 *  Extra attributes:
 *    data-animate-delay="0.2"     per-element delay
 *    data-animate-duration="1"    custom duration
 *    data-animate-start="top 80%" custom ScrollTrigger start
 *
 *  Stagger groups:
 *    Place `data-animate-stagger="0.1"` on a wrapper.
 *    Its direct children that have `data-animate` will be animated
 *    as a single staggered group (one ScrollTrigger on the wrapper).
 *
 *  Behavior:
 *    - Elements already in viewport on mount → animate immediately
 *    - Elements below the fold → animate via ScrollTrigger
 * ──────────────────────────────────────────────────────────────────── */

type FromVals = Record<string, number>;

const VARIANTS: Record<string, FromVals> = {
  up: { y: 20, autoAlpha: 0 },
  down: { y: -20, autoAlpha: 0 },
  left: { x: 20, autoAlpha: 0 },
  right: { x: -20, autoAlpha: 0 },
  fade: { autoAlpha: 0 },
  scale: { scale: 0.97, autoAlpha: 0 },
  "scale-x": { scaleX: 0, autoAlpha: 0 },
};

const toVals = (from: FromVals): FromVals =>
  Object.fromEntries(
    Object.keys(from).map((k) => [
      k,
      k === "autoAlpha" || k === "opacity" || k === "scale" || k === "scaleX"
        ? 1
        : 0,
    ]),
  );

const EASE = "power3.out";
const DURATION = 0.8;
const START = "top 88%";

/**
 * Parse ScrollTrigger start string like "top 88%" to get viewport threshold.
 * Returns a decimal (0-1) representing the percentage of viewport height.
 */
const parseStartThreshold = (start: string): number => {
  const match = start.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) / 100 : 0.88;
};

/**
 * Check if an element is already in the viewport (above the scroll trigger start).
 */
const isInInitialViewport = (el: HTMLElement, threshold: number): boolean => {
  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  return rect.top < viewportHeight * threshold;
};

export default function useViewEntrance(pathname: string) {
  const scopeRef = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const root = scopeRef.current;
    if (!root) return;

    const shouldAnimate = shouldRunViewEntrance(pathname);

    /* ── 1. Identify stagger containers ── */
    const staggerContainers = root.querySelectorAll<HTMLElement>(
      "[data-animate-stagger]",
    );
    const groupedEls = new Set<HTMLElement>();

    type StaggerGroup = {
      container: HTMLElement;
      children: HTMLElement[];
      stagger: number;
    };
    const groups: StaggerGroup[] = [];

    staggerContainers.forEach((container) => {
      const children = Array.from(
        container.querySelectorAll<HTMLElement>(":scope > [data-animate]"),
      );
      if (children.length === 0) return;
      children.forEach((c) => groupedEls.add(c));
      groups.push({
        container,
        children,
        stagger: parseFloat(
          container.getAttribute("data-animate-stagger") || "0.08",
        ),
      });
    });

    /* ── 2. Standalone elements ── */
    const all = root.querySelectorAll<HTMLElement>("[data-animate]");
    const standalone: HTMLElement[] = [];
    all.forEach((el) => {
      if (el.hasAttribute("data-animate-stagger")) return;
      if (groupedEls.has(el)) return;
      standalone.push(el);
    });

    if (standalone.length === 0 && groups.length === 0) return;

    const ctx = gsap.context(() => {
      if (!shouldAnimate) {
        // If animations are suppressed (e.g. reload), ensure elements are visible
        gsap.set([...Array.from(all)], { clearProps: "all" });
        return;
      }

      /* ── Prevent FOUC ── */
      // Immediately set all elements to their starting state
      standalone.forEach((el) => {
        const variant = el.getAttribute("data-animate") || "up";
        const from = VARIANTS[variant] || VARIANTS.up;
        gsap.set(el, { ...from, autoAlpha: 0 });
      });

      groups.forEach(({ children }) => {
        const variant = children[0].getAttribute("data-animate") || "up";
        const from = VARIANTS[variant] || VARIANTS.up;
        gsap.set(children, { ...from, autoAlpha: 0 });
      });

      // Use a tiny timeout to ensure layout is stable before checking viewport
      const timer = setTimeout(() => {
        let immediateBaseDelay = 0;

        standalone.forEach((el) => {
          const variant = el.getAttribute("data-animate") || "up";
          const from = VARIANTS[variant] || VARIANTS.up;
          const delay = parseFloat(
            el.getAttribute("data-animate-delay") || "0",
          );
          const duration = parseFloat(
            el.getAttribute("data-animate-duration") || String(DURATION),
          );
          const start = el.getAttribute("data-animate-start") || START;
          const forceScroll = el.getAttribute("data-animate-scroll") === "true";
          const threshold = parseStartThreshold(start);

          const inView = isInInitialViewport(el, threshold);
          const isImmediate = inView && !forceScroll;

          gsap.to(el, {
            ...toVals(from),
            autoAlpha: 1,
            duration,
            delay: isImmediate ? immediateBaseDelay + delay : delay,
            ease: variant === "scale-x" ? "expo.inOut" : EASE,
            clearProps: "all",
            scrollTrigger: isImmediate
              ? null
              : { trigger: el, start, once: true },
          });

          if (isImmediate && delay === 0) {
            immediateBaseDelay += 0.08;
          }
        });

        groups.forEach(({ container, children, stagger }) => {
          const variant = children[0].getAttribute("data-animate") || "up";
          const from = VARIANTS[variant] || VARIANTS.up;
          const duration = parseFloat(
            children[0].getAttribute("data-animate-duration") ||
              String(DURATION),
          );
          const start = container.getAttribute("data-animate-start") || START;
          const forceScroll =
            container.getAttribute("data-animate-scroll") === "true";
          const threshold = parseStartThreshold(start);

          const inView = isInInitialViewport(container, threshold);
          const isImmediate = inView && !forceScroll;

          gsap.to(children, {
            ...toVals(from),
            autoAlpha: 1,
            duration,
            delay: isImmediate ? immediateBaseDelay : 0,
            stagger,
            ease: EASE,
            clearProps: "all",
            scrollTrigger: isImmediate
              ? null
              : { trigger: container, start, once: true },
          });

          if (isImmediate) {
            immediateBaseDelay += stagger * children.length;
          }
        });
      }, 50);

      return () => clearTimeout(timer);
    }, root);

    return () => ctx.revert();
  }, [pathname]);

  return scopeRef;
}
