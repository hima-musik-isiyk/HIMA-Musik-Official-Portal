const ENTRANCE_NEXT_ROUTE_KEY = "hima_view_entrance_next_route";
const SESSION_STARTED_KEY = "hima_view_entrance_session_active";

/**
 * Eagerly computed reload flag for the entire session lifecycle.
 */
const _isReload: boolean = (() => {
  if (typeof window === "undefined") return false;

  const sessionActive = window.sessionStorage.getItem(SESSION_STARTED_KEY);

  // If this is the start of a session, it cannot be a reload of this app's state
  if (!sessionActive) {
    window.sessionStorage.setItem(SESSION_STARTED_KEY, "true");
    return false;
  }

  // If session is active, verify navigation type
  const [entry] = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  const navType = entry?.type;

  return navType === "reload" || navType === "back_forward";
})();

// The pathname that was active when the reload happened.
// We normalize to ensure trailing slashes don't break comparison.
const normalizePath = (p: string) => (p === "/" ? p : p.replace(/\/$/, ""));

const _reloadPathname: string | null =
  _isReload && typeof window !== "undefined"
    ? normalizePath(window.location.pathname)
    : null;

let reloadSkipCleared = false;

/**
 * Returns `true` when the current page session started from a hard reload
 * or back/forward navigation.
 */
export const isPageReload = (): boolean => _isReload;

/**
 * Marks that the next route navigation is intentional and should NOT be
 * suppressed even if it normally would be (e.g. following a reload).
 */
export const flagViewEntranceForNextRoute = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ENTRANCE_NEXT_ROUTE_KEY, "true");
};

/**
 * Determines if view entrance animations should run for a given pathname.
 * Handles page reloads, SPA transitions, and reduced motion.
 */
export const shouldRunViewEntrance = (pathname: string): boolean => {
  if (typeof window === "undefined") return false;

  // 1. Respect user preferences
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  // 2. Check for explicit animation flags (forced transitions)
  const isForced = window.sessionStorage.getItem(ENTRANCE_NEXT_ROUTE_KEY);
  if (isForced) {
    window.sessionStorage.removeItem(ENTRANCE_NEXT_ROUTE_KEY);
    reloadSkipCleared = true; // Clear reload suppression if we forced a navigation
    return true;
  }

  // 3. Handle Hard Reload suppression
  if (_reloadPathname !== null && !reloadSkipCleared) {
    const normalizedTarget = normalizePath(pathname);
    if (normalizedTarget === _reloadPathname) {
      return false;
    }
    // Once we move to any other path, the reload suppression is over.
    reloadSkipCleared = true;
  }

  return true;
};
