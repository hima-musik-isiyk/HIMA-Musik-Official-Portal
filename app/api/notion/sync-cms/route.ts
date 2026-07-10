import { NextResponse } from "next/server";

import { revalidateCmsCaches } from "@/lib/cms-sync";
import { syncContainerCMSSnapshot } from "@/lib/notion-builder";

function isAuthorized(request: Request): boolean {
  const secrets = [
    process.env.CRON_SECRET,
    process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN,
  ].filter(Boolean);

  if (!secrets.length) return true;

  const authorization = request.headers.get("authorization");
  const syncSecret = request.headers.get("x-sync-secret");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");

  return secrets.some(
    (secret) =>
      authorization === `Bearer ${secret}` ||
      syncSecret === secret ||
      querySecret === secret,
  );
}

async function handleSync(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const { data, snapshot } = await syncContainerCMSSnapshot();

    revalidateCmsCaches(data.pages);

    return NextResponse.json({
      ok: true,
      snapshot,
      counts: {
        pages: data.pages.length,
        redirects: data.redirects.length,
        footer: data.footer.length,
        componentRegistry: Object.keys(data.componentRegistry).length,
      },
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("[CMS Sync] Failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to sync CMS snapshot",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return handleSync(request);
}

export async function GET(request: Request) {
  return handleSync(request);
}
