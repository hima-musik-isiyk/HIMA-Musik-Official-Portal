import { NextResponse } from "next/server";

import { generateKaryaEmailTemplate, sendBrevoEmail } from "@/lib/brevo";
import { sendDiscordWebhook } from "@/lib/discord";
import { fetchKaryaDatabaseIdCached, getNotionClient } from "@/lib/notion";

export async function POST(request: Request) {
  const KARYA_PAGE_ID = process.env.NOTION_KARYA_PAGE_ID;
  const DISCORD_WEBHOOK_URL =
    process.env.DISCORD_KARYA_WEBHOOK_URL ||
    "https://discord.com/api/webhooks/1509621771136012391/HubUQorPzJOhOnODs6xJQtiei1gpE2e6cEuQzX019NNEfLYpuBDB9Ik98X_ZgPOGqk2H";

  if (!KARYA_PAGE_ID) {
    return NextResponse.json(
      { error: "Karya Page ID not configured" },
      { status: 500 },
    );
  }

  try {
    const activeDbId = await fetchKaryaDatabaseIdCached(KARYA_PAGE_ID);
    if (!activeDbId) {
      return NextResponse.json(
        { error: "Karya Database ID could not be resolved from parent page" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { title, creator, nim, genres, platform, embedLink, email } = body;

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

    const response = await notion.pages.create({
      parent: { database_id: activeDbId },
      properties: {
        "Band/Artist dan Judul Karya / Tayangan": {
          title: [{ text: { content: title } }],
        } as any,
        Status: { status: { name: "Masuk" } } as any,
        "Pencipta / Penampil": {
          rich_text: [{ text: { content: creator } }],
        } as any,
        "NIM Penanggung Jawab": {
          number: parseInt(nim, 10),
        } as any,
        Email: {
          email: email || "",
        } as any,
        "Genre / Jenis Karya": {
          multi_select: (genres || []).map((g: string) => ({ name: g })),
        } as any,
        "Platform Utama": {
          multi_select: [{ name: platform }],
        } as any,
        "Link Embed Utama (Full URL)": {
          url: embedLink,
        } as any,
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

    // 3. Send confirmation email to respondent via Brevo
    if (email && email.trim() !== "" && email.includes("@")) {
      try {
        const htmlContent = generateKaryaEmailTemplate({
          title,
          creator,
          nim,
          platform,
          genres: Array.isArray(genres) ? genres.join(", ") : genres || "—",
          embedLink,
          status: "Masuk",
          submissionTime: new Date().toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            dateStyle: "long",
            timeStyle: "short",
          }),
        });

        await sendBrevoEmail({
          to: email,
          subject: `Salinan Pengajuan Karya HIMA: ${title}`,
          htmlContent,
        });
      } catch (emailError) {
        console.error(
          "[submit-karya] Failed to send confirmation email via Brevo:",
          emailError,
        );
        // Non-fatal: submission is still considered successful
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
