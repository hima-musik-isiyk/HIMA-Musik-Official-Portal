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

    // Send to Discord if configured
    const rawWebhookUrl =
      process.env.DISCORD_RAW_WEBHOOK_URL ||
      process.env.DISCORD_WEBHOOK_RAW_URL;

    if (rawWebhookUrl) {
      try {
        await fetch(rawWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "Notion Automation Logger",
            avatar_url: "https://www.notion.so/images/logo-ios.png",
            embeds: [
              {
                title: "Notion Webhook Received: sync-presensi",
                description: "Incoming payload from Notion automation.",
                color: 0x000000,
                fields: [
                  {
                    name: "Page ID",
                    value: body?.data?.id || "unknown",
                    inline: true,
                  },
                  {
                    name: "Object",
                    value: body?.data?.object || "unknown",
                    inline: true,
                  },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });

        // Send raw payload in a separate message if it's large, or just another embed
        const rawPayload = JSON.stringify(body, null, 2);
        const chunks =
          rawPayload.length > 2000
            ? [rawPayload.slice(0, 1900) + "... (truncated)"]
            : [rawPayload];

        for (const chunk of chunks) {
          await fetch(rawWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "Notion Automation Logger",
              content: `\`\`\`json\n${chunk}\n\`\`\``,
            }),
          });
        }
      } catch (discordError) {
        console.error(
          "Failed to send Notion payload to Discord:",
          discordError,
        );
      }
    }

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
