import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const DEFAULT_GSAP_EASING = "power3.out";

export function getCmsGsapEasing(): string {
  if (typeof document === "undefined") return DEFAULT_GSAP_EASING;
  const easing = document.documentElement.dataset.gsapEasing?.trim();
  return easing || DEFAULT_GSAP_EASING;
}

export { gsap, ScrollTrigger };
