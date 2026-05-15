"use client";

import { useEffect } from "react";

export default function LegacyHashRedirect() {
  useEffect(() => {
    try {
      const rawHash = window.location.hash.slice(1).trim();
      if (!rawHash) return;

      const hashPath = rawHash.startsWith("!") ? rawHash.slice(1) : rawHash;
      const normalizedPath = hashPath.startsWith("/")
        ? hashPath
        : "/" + hashPath;

      let parsed: URL | null = null;
      try {
        parsed = new URL(normalizedPath, window.location.origin);
      } catch {
        return;
      }

      const target = parsed.pathname + parsed.search;
      const current = window.location.pathname + window.location.search;
      if (target !== current) {
        window.location.replace(target);
      }
    } catch {
      // swallow errors silently
    }
  }, []);

  return null;
}
