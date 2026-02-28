const VISITED_ROUTES_KEY = "viewEntranceVisited";
const ENTRANCE_NEXT_ROUTE_KEY = "viewEntranceNextRoute";

/**
 * Module-level flags — persist across SPA navigations within one browser tab
 * but reset on a full page reload or HMR re-evaluation.
 *
 * `handledInitialLoad`: ensures we only inspect the Navigation Timing API once
 * per page load (it always reflects the *initial* load, not SPA transitions).
 *
 * `reloadSkipPathname`: when the initial load was a reload / back_forward we
 * must suppress animation for that specific route. We track it so that React 18
 * Strict Mode's second effect invocation also returns `false` for the *same*
 * route, but clears itself as soon as the user navigates elsewhere.
 */
let handledInitialLoad = false;
let reloadSkipPathname: string | null = null;

const getNavigationType = (): PerformanceNavigationTiming["type"] | null => {
  if (typeof window === "undefined") return null;
  const [entry] = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  return entry?.type ?? null;
};

const getVisitedRoutes = (): Set<string> => {
  try {
    const raw = window.sessionStorage.getItem(VISITED_ROUTES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const markRouteVisited = (pathname: string) => {
  try {
    const visited = getVisitedRoutes();
    visited.add(pathname);
    window.sessionStorage.setItem(
      VISITED_ROUTES_KEY,
      JSON.stringify([...visited]),
    );
  } catch {}
};

/**
 * Defer `markRouteVisited` by a micro-tick so that React 18 Strict Mode's
 * synchronous mount → cleanup → remount cycle sees the route as "not visited"
 * on BOTH invocations. The mark lands in sessionStorage only after both
 * effects have finished.
 */
const deferMarkRouteVisited = (pathname: string) => {
  setTimeout(() => markRouteVisited(pathname), 0);
};

export const flagViewEntranceForNextRoute = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ENTRANCE_NEXT_ROUTE_KEY, "true");
};

export const shouldRunViewEntrance = (pathname: string) => {
  if (typeof window === "undefined") return false;

  // Respect reduced motion preference — always skip, never mark
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceMotion) return false;

  // ── Hard page load (reload / back_forward) ─────────────────────────────
  if (!handledInitialLoad) {
    handledInitialLoad = true;
    const navigationType = getNavigationType();
    if (navigationType === "reload" || navigationType === "back_forward") {
      reloadSkipPathname = pathname;
      window.sessionStorage.removeItem(ENTRANCE_NEXT_ROUTE_KEY);
      return false;
    }
  }

  // Strict Mode guard: still on the same reload/back_forward route
  if (reloadSkipPathname !== null) {
    if (reloadSkipPathname === pathname) return false;
    // Navigated away from the reload route — clear the guard
    reloadSkipPathname = null;
  }

  // ── Intentional re-animation flag (set by footer/nav link clicks) ───────
  const shouldAnimateNextRoute =
    window.sessionStorage.getItem(ENTRANCE_NEXT_ROUTE_KEY) === "true";

  if (shouldAnimateNextRoute) {
    window.sessionStorage.removeItem(ENTRANCE_NEXT_ROUTE_KEY);
    deferMarkRouteVisited(pathname);
    return true;
  }

  // ── Per-route check: only animate if this route hasn't been visited yet ─
  const visited = getVisitedRoutes();
  if (!visited.has(pathname)) {
    deferMarkRouteVisited(pathname);
    return true;
  }

  return false;
};
