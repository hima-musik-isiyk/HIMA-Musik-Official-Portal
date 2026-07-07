import type { Division } from "./pendaftaran-data";

const STORAGE_KEY = "hima_divisions_cache";

let inMemoryDivisions: Division[] | null = null;
let pendingDivisionsFetch: Promise<Division[]> | null = null;

export function readCachedDivisions(): Division[] | null {
  if (inMemoryDivisions) return inMemoryDivisions;
  if (typeof window === "undefined") return null;

  try {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!Array.isArray(parsed)) return null;
    inMemoryDivisions = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function fetchDivisionsOnce(): Promise<Division[]> {
  if (inMemoryDivisions) return Promise.resolve(inMemoryDivisions);
  if (pendingDivisionsFetch) return pendingDivisionsFetch;

  pendingDivisionsFetch = fetch("/api/divisions")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch divisions");
      return res.json();
    })
    .then((res) => {
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error("Invalid divisions response");
      }
      inMemoryDivisions = res.data;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      } catch {}
      return res.data;
    })
    .finally(() => {
      pendingDivisionsFetch = null;
    });

  return pendingDivisionsFetch;
}
