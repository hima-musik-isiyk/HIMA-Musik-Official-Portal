import { NextResponse } from "next/server";

import { sendDiscordWebhook } from "@/lib/discord";
import {
  createFAQEntry,
  fetchFAQCategoriesCached,
  fetchFAQEntries,
  filterFAQVisibility,
} from "@/lib/faq";

export const revalidate = 0; // Dynamic API route

const DISCORD_FIELD_LIMIT = 1024;
const truncate = (value: string, maxLength = DISCORD_FIELD_LIMIT) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

export async function GET() {
  try {
    const [rawEntries, categories] = await Promise.all([
      fetchFAQEntries(),
      fetchFAQCategoriesCached(),
    ]);
    const visibleEntries = filterFAQVisibility(rawEntries);

    return NextResponse.json({
      success: true,
      data: visibleEntries,
      categories,
    });
  } catch (error) {
    console.error("[FAQ API GET] Error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data FAQ",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { question, askerName, category } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Pertanyaan wajib diisi." },
        { status: 400 },
      );
    }

    if (!askerName || typeof askerName !== "string" || !askerName.trim()) {
      return NextResponse.json(
        { error: "Nama penanya wajib diisi." },
        { status: 400 },
      );
    }

    const cleanCategory =
      typeof category === "string" ? category.trim() : "Lainnya";

    // 1. Write to Notion FAQ Database
    try {
      await createFAQEntry(question, askerName, cleanCategory);
    } catch (notionError) {
      console.error("[FAQ API POST] Notion write failed:", notionError);
      return NextResponse.json(
        {
          error: "Gagal menyimpan pertanyaan ke Notion",
          details:
            notionError instanceof Error
              ? notionError.message
              : "Unknown Notion error",
        },
        { status: 500 },
      );
    }

    // 2. Dispatch notification to Discord webhook (DISCORD_FAQ_WEBHOOK_URL)
    const webhookUrl = process.env.DISCORD_FAQ_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const payload = {
          username: "FAQ & Tanya Jawab Portal",
          avatar_url:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Discord_logo_svg.svg/1024px-Discord_logo_svg.svg.png",
          embeds: [
            {
              title: "Pertanyaan FAQ Baru Masuk",
              description: `Seseorang telah menanyakan sesuatu di official portal HIMA Musik.`,
              color: 0x3498db, // Elegant blue color
              timestamp: new Date().toISOString(),
              fields: [
                {
                  name: "Nama Penanya",
                  value: truncate(askerName),
                  inline: true,
                },
                {
                  name: "Kategori",
                  value: truncate(cleanCategory),
                  inline: true,
                },
                {
                  name: "Pertanyaan",
                  value: truncate(question, 4096),
                  inline: false,
                },
              ],
              footer: { text: "HIMA Musik Official Portal - FAQ" },
            },
          ],
        };

        await sendDiscordWebhook(
          webhookUrl,
          payload,
          "FAQ Submission notification to Discord",
        );
      } catch (discordError) {
        console.error(
          "[FAQ API POST] Discord notification failed:",
          discordError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pertanyaan Anda berhasil dikirim dan akan segera diproses.",
    });
  } catch (error) {
    console.error("[FAQ API POST] General error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
