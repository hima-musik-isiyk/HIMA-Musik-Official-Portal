import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sendDiscordWebhook } from "@/lib/discord";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      intent?: string;
      formType?: string;
      name?: string;
      nim?: string;
      department?: string;
      reason?: string;
      date?: string;
      items?: string;
      notes?: string;
    };

    const {
      intent,
      formType,
      name,
      nim,
      department,
      reason,
      date,
      items,
      notes,
    } = body;

    if (intent !== "submit-form") {
      return NextResponse.json(
        { error: "Intent tidak valid" },
        { status: 400 },
      );
    }

    if (!formType || !name) {
      return NextResponse.json(
        { error: "Data form tidak lengkap" },
        { status: 400 },
      );
    }

    const webhookUrl = process.env.DISCORD_FORMS_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("DISCORD_FORMS_WEBHOOK_URL is not configured.");
    }

    /* ---- Send Discord notification ---- */
    if (webhookUrl) {
      const fields = [
        { name: "Tipe Form", value: formType, inline: true },
        { name: "Nama", value: name, inline: true },
        ...(nim ? [{ name: "NIM", value: nim, inline: true }] : []),
        ...(department
          ? [{ name: "Prodi", value: department, inline: true }]
          : []),
        ...(date ? [{ name: "Tanggal", value: date, inline: true }] : []),
        ...(reason ? [{ name: "Alasan", value: reason, inline: false }] : []),
        ...(items
          ? [{ name: "Daftar Item", value: items, inline: false }]
          : []),
        ...(notes ? [{ name: "Catatan", value: notes, inline: false }] : []),
      ];

      const payload = {
        username: "Sekretariat HIMA Musik",
        avatar_url:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Discord_logo_svg.svg/1024px-Discord_logo_svg.svg.png",
        embeds: [
          {
            title: `Layanan Mandiri: ${formType}`,
            description: `Permintaan form baru saja dikirim oleh **${name}** melalui Portal Resmi HIMA Musik.`,
            color: 0xd4a64d,
            timestamp: new Date().toISOString(),
            fields,
            footer: { text: "HIMA Musik Official Portal" },
          },
        ],
      };

      try {
        await sendDiscordWebhook(
          webhookUrl,
          payload,
          "Sekretariat Form notification to Discord",
        );
      } catch (discordError) {
        console.error("Discord notification failed:", discordError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Permintaan berhasil dikirim. Sekretaris akan segera memproses.",
    });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
