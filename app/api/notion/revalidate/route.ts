import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { syncContainerCMSSnapshot } from "@/lib/notion-builder";
import { revalidateScope } from "@/lib/notion-revalidate-helper";

// In-memory rate limiting timestamp for active server instances
let lastRevalidateTime = 0;
const COOLDOWN_MS = 10000; // 10 seconds cooldown

export async function POST() {
  const now = Date.now();
  const timePassed = now - lastRevalidateTime;

  if (timePassed < COOLDOWN_MS) {
    const secondsLeft = Math.ceil((COOLDOWN_MS - timePassed) / 1000);
    return NextResponse.json({
      ok: true,
      status: "cooldown",
      message: `Revalidation is on cooldown. Please wait ${secondsLeft} second(s).`,
      secondsLeft,
    });
  }

  try {
    // Update timestamp
    lastRevalidateTime = now;

    let snapshotStatus: "synced" | "skipped" | "failed" = "skipped";
    let snapshotError: string | null = null;
    try {
      const { snapshot } = await syncContainerCMSSnapshot();
      snapshotStatus = snapshot.ok ? "synced" : "failed";
      snapshotError = snapshot.error ?? null;
      revalidateTag("notion-container", { expire: 0 });
    } catch (err) {
      snapshotStatus = "failed";
      snapshotError = err instanceof Error ? err.message : "Unknown error";
      console.error(
        "[Notion Public Revalidate] CMS snapshot sync failed:",
        err,
      );
    }

    // Trigger instant cache revalidation for all relevant CMS scopes
    const scopes = [
      "events",
      "beranda",
      "profil",
      "kkm",
      "faq",
      "redirects",
    ] as const;
    for (const scope of scopes) {
      try {
        revalidateScope(scope);
      } catch (err) {
        console.error(`Failed to revalidate scope ${scope}:`, err);
      }
    }

    console.warn(
      "[Notion Public Revalidate] All CMS page scopes revalidated successfully on demand.",
    );

    return NextResponse.json({
      ok: true,
      status: "success",
      snapshotStatus,
      snapshotError,
      message:
        "Konten website berhasil disinkronkan dengan data terbaru dari Notion!",
    });
  } catch (error: unknown) {
    console.error("[Notion Public Revalidate] Failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Gagal menyinkronkan data. Silakan coba beberapa saat lagi.",
      },
      { status: 500 },
    );
  }
}

// Support GET requests as well for easy triggers
export async function GET() {
  return POST();
}
