import { NextResponse } from "next/server";

/**
 * Minimal Webhook Logger for Notion Automations
 * Use this to inspect the payload structure from Notion "Send webhook" action.
 */

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/notion/sync-presensi",
    message: "Send a POST request from Notion Automation to see logs.",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log to server console (visible in terminal / cloud logs)
    console.warn("🚀 [Notion Webhook] Incoming Payload:");
    console.warn(JSON.stringify(body, null, 2));

    // Return the payload back for immediate inspection if testing via Postman/Curl
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      notion_page_id: body?.data?.id || "unknown",
      payload: body,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [Notion Webhook] Error parsing payload:", errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON payload",
      },
      { status: 400 },
    );
  }
}
