import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DISCORD_FIELD_LIMIT = 1024;

const truncate = (value: string, maxLength = DISCORD_FIELD_LIMIT) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

const sendDiscordWebhook = async (
  webhookUrl: string,
  payload: Record<string, unknown>,
  context: string,
) => {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `${context} failed (${response.status}): ${responseText || "No response body"}`,
    );
  }
};

export async function POST(request: Request) {
  try {
    const body = await request
      .json()
      .catch(() => ({}) as Record<string, unknown>);
    const { intent, name, nim, category, message } = body as Record<
      string,
      unknown
    >;

    if (intent !== "submit-aduan") {
      return NextResponse.json(
        { error: "Invalid submit intent" },
        { status: 400 },
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const webhookUrl = process.env.DISCORD_ADUAN_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("Missing environment variables:", {
        hasDiscordAduanWebhookUrl: !!webhookUrl,
      });
      return NextResponse.json(
        { error: "Server misconfiguration: Missing env variables" },
        { status: 500 },
      );
    }

    const safeName = typeof name === "string" && name.trim() ? name : "Anonim";
    const safeNim = typeof nim === "string" && nim.trim() ? nim : "-";
    const safeCategory =
      typeof category === "string" && category.trim() ? category : "Umum";
    const safeMessage = message.trim();

    const payload = {
      username: "HIMA Musik Aduan",
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: "Aduan Baru Masuk",
          description: truncate(safeMessage, 4096),
          color: 0xd4a64d,
          timestamp: new Date().toISOString(),
          fields: [
            { name: "Nama", value: truncate(safeName), inline: true },
            { name: "NIM", value: truncate(safeNim), inline: true },
            { name: "Kategori", value: truncate(safeCategory), inline: true },
          ],
          footer: { text: "HIMA Musik Official Portal" },
        },
      ],
    };

    try {
      await sendDiscordWebhook(
        webhookUrl,
        payload,
        "Aduan notification to Discord",
      );
    } catch (discordError) {
      console.error("Discord API Error:", discordError);
      return NextResponse.json(
        {
          error: "Failed to send to Discord",
          details:
            discordError instanceof Error
              ? discordError.message
              : "Unknown Discord error",
        },
        { status: 500 },
      );
    }

    try {
      await prisma.aduan.create({
        data: {
          name: typeof name === "string" && name.trim() ? name.trim() : null,
          nim: typeof nim === "string" && nim.trim() ? nim.trim() : null,
          category:
            typeof category === "string" && category.trim()
              ? category.trim()
              : "Umum",
          message: message.trim(),
        },
      });
    } catch (dbError) {
      console.error("DB write failed (aduan):", dbError);

      const errorWebhookUrl =
        process.env.DISCORD_ERROR_WEBHOOK_URL ?? webhookUrl;

      if (errorWebhookUrl) {
        try {
          await sendDiscordWebhook(
            errorWebhookUrl,
            {
              username: "HIMA Musik Alerts",
              allowed_mentions: { parse: [] },
              embeds: [
                {
                  title: "DB Write Failed - Aduan",
                  description:
                    "Discord notification sent, but aduan data was not saved to database. Manual entry required.",
                  color: 0xff4d4f,
                  timestamp: new Date().toISOString(),
                  fields: [
                    { name: "Nama", value: truncate(safeName), inline: true },
                    {
                      name: "Kategori",
                      value: truncate(safeCategory),
                      inline: true,
                    },
                  ],
                  footer: { text: "HIMA Musik Official Portal" },
                },
              ],
            },
            "DB error notification to Discord",
          );
        } catch (discordError) {
          console.error(
            "Failed to send DB error notification to Discord:",
            discordError,
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
