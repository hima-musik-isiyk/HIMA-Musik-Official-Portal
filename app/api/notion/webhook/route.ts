/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";

import { handleNotionRoomWebhook } from "@/lib/notion-room/webhook";
import { inferScopes, revalidateScope } from "@/lib/notion-revalidate-helper";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  // 1. Clone the request so it can be read multiple times (for room sync and cache revalidation)
  const clonedRequest = request.clone();

  // 2. Broadcast the event for Notion Context Rooms in real time
  const roomResponse = await handleNotionRoomWebhook(request).catch((err) => {
    console.error("[Notion Webhook] Room webhook error:", err);
    return null;
  });

  // 3. Process Next.js cache revalidation for CMS pages
  try {
    const payload = await clonedRequest.json().catch(() => null);
    if (payload) {
      const scopes = await inferScopes(payload);
      if (scopes && scopes.length > 0) {
        console.warn(
          `[Notion CMS Webhook] Revalidating scopes: ${scopes.join(", ")}`,
        );
        for (const scope of scopes) {
          try {
            revalidateScope(scope);
          } catch (revalError) {
            console.error(
              `[Notion CMS Webhook] Failed to revalidate scope ${scope}:`,
              revalError,
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("[Notion CMS Webhook] Revalidation failed:", error);
  }

  return roomResponse || NextResponse.json({ ok: true });
}
