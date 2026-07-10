"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type CmsStatusResponse = {
  ok?: boolean;
  snapshot?: {
    contentHash?: string | null;
    syncedAt?: string | null;
    updatedAt?: string | null;
  } | null;
};

function getSnapshotVersion(payload: CmsStatusResponse) {
  const snapshot = payload.snapshot;
  return (
    snapshot?.contentHash || snapshot?.syncedAt || snapshot?.updatedAt || ""
  );
}

function getRefreshIntervalMs() {
  const raw = process.env.NEXT_PUBLIC_CMS_LIVE_REFRESH_INTERVAL_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : 10000;
  return Number.isFinite(parsed) && parsed >= 3000 ? parsed : 10000;
}

export default function CmsLiveRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const versionRef = useRef<string>("");
  const refreshingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const intervalMs = getRefreshIntervalMs();

    async function checkSnapshot() {
      if (cancelled || document.visibilityState !== "visible") return;

      try {
        const response = await fetch("/api/notion/cms-status", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const payload = (await response.json()) as CmsStatusResponse;
        const version = getSnapshotVersion(payload);
        if (!version) return;

        if (!versionRef.current) {
          versionRef.current = version;
          return;
        }

        if (versionRef.current !== version && !refreshingRef.current) {
          versionRef.current = version;
          refreshingRef.current = true;
          router.refresh();
          window.setTimeout(() => {
            refreshingRef.current = false;
          }, 1500);
        }
      } catch {
        // Keep the public page quiet if the status probe fails.
      }
    }

    checkSnapshot();
    const interval = window.setInterval(checkSnapshot, intervalMs);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkSnapshot();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, router]);

  return null;
}
