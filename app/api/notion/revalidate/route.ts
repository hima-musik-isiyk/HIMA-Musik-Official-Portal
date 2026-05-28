import { NextResponse } from "next/server";

import { revalidateScope } from "@/lib/notion-revalidate-helper";

export const runtime = "nodejs";

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

    // Trigger instant cache revalidation for all relevant CMS scopes
    const scopes = ["events", "beranda", "profil", "kkm", "faq"] as const;
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
