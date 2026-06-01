/**
 * Checks if the universal entrance animation toggle is enabled from Notion CMS.
 */
export const isEntranceAnimateEnabled = (): boolean => {
  if (typeof document === "undefined") return true;
  return document.documentElement.dataset.entranceAnimate !== "false";
};

/**
 * Determines if view entrance animations should run for a given pathname.
 * Handles page reloads, SPA transitions, and reduced motion.
 */
export const shouldRunViewEntrance = (_pathname: string): boolean => {
  if (typeof window === "undefined") return false;

  // Respect user preferences for reduced motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  // Entrance animations should run on every navigation as requested.
  return true;
};

/**
 * Returns `true` when the current page session started from a hard reload
 * or back/forward navigation.
 * Kept for backward compatibility, but now effectively irrelevant for suppression.
 */
export const isPageReload = (): boolean => {
  if (typeof window === "undefined") return false;
  const [entry] = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  return entry?.type === "reload" || entry?.type === "back_forward";
};

/**
 * Marks that the next route navigation is intentional.
 * Now a no-op as all transitions animate by default.
 */
export const flagViewEntranceForNextRoute = () => {
  // No-op: all transitions now animate by default.
};
