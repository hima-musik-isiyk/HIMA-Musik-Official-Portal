import { NextResponse } from "next/server";

import { sendDiscordWebhook } from "@/lib/discord";
import { getNotionClient } from "@/lib/notion";

export async function POST(request: Request) {
  const KARYA_DB_ID = process.env.NOTION_KARYA_DATABASE_ID;
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_KARYA_WEBHOOK_URL;

  if (!KARYA_DB_ID) {
    return NextResponse.json(
      { error: "Karya Database ID not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { title, creator, nim, genres, platform, embedLink } = body;

    // Simple validation
    if (!title || !creator || !nim || !platform || !embedLink) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const notion = getNotionClient();
    if (!notion) {
      return NextResponse.json(
        { error: "Notion client not initialized" },
        { status: 500 },
      );
    }

    const today = new Date().toISOString().split("T")[0];

    const response = await notion.pages.create({
      parent: { database_id: KARYA_DB_ID },
      properties: {
        "Judul Karya": { title: [{ text: { content: title } }] } as any,
        "Status Verifikasi": { status: { name: "Masuk" } } as any,
        "Status Konten CMS": { status: { name: "Draf" } } as any,
        "Pencipta / Penampil": {
          rich_text: [{ text: { content: creator } }],
        } as any,
        "NIM Penanggung Jawab": {
          rich_text: [{ text: { content: nim } }],
        } as any,
        "Genre / Jenis Karya": {
          multi_select: (genres || []).map((g: string) => ({ name: g })),
        } as any,
        "Platform Utama": { select: { name: platform } } as any,
        "Link Embed": { rich_text: [{ text: { content: embedLink } }] } as any,
        "Integritas Riwayat": { date: { start: today } } as any,
      },
    });

    if (DISCORD_WEBHOOK_URL) {
      try {
        await sendDiscordWebhook(
          DISCORD_WEBHOOK_URL,
          {
            username: "HIMA Musik Karya Bot",
            embeds: [
              {
                title: "🎨 Karya Baru Masuk",
                description: `Satu karya baru telah disubmit dan menunggu verifikasi.`,
                color: 0x3b82f6,
                fields: [
                  { name: "Judul Karya", value: title, inline: false },
                  { name: "Pencipta / Penampil", value: creator, inline: true },
                  { name: "NIM Penanggung Jawab", value: nim, inline: true },
                  {
                    name: "Genre",
                    value: (genres || []).join(", ") || "-",
                    inline: true,
                  },
                  { name: "Platform", value: platform, inline: true },
                  { name: "Link", value: embedLink, inline: false },
                ],
                timestamp: new Date().toISOString(),
                footer: { text: "HIMA Musik Official Portal" },
              },
            ],
          },
          "Karya notification to Discord",
        );
      } catch (discordError) {
        console.error("Failed to send Discord notification:", discordError);
      }
    }

    return NextResponse.json({ success: true, id: response.id });
  } catch (error: any) {
    console.error("Error submitting karya:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
