import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { notion } from "@/lib/notion";

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

    const KANBAN_DB_ID = process.env.NOTION_KANBAN_DATABASE_ID;
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const TELEGRAM_FORMS_TOPIC_ID = process.env.TELEGRAM_FORMS_TOPIC_ID;

    /* ---- Create card in Notion Kanban ---- */
    if (KANBAN_DB_ID) {
      try {
        await notion.pages.create({
          parent: { database_id: KANBAN_DB_ID },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: `[${formType}] ${name}`,
                  },
                },
              ],
            },
            Status: {
              select: { name: "To Do" },
            },
            Type: {
              select: { name: formType },
            },
            ...(nim
              ? {
                  NIM: {
                    rich_text: [{ text: { content: nim } }],
                  },
                }
              : {}),
            ...(department
              ? {
                  Department: {
                    rich_text: [{ text: { content: department } }],
                  },
                }
              : {}),
            ...(date
              ? {
                  Date: {
                    date: { start: date },
                  },
                }
              : {}),
          },
          children: [
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: [
                        `Nama: ${name}`,
                        nim ? `NIM: ${nim}` : "",
                        department ? `Prodi: ${department}` : "",
                        reason ? `Alasan: ${reason}` : "",
                        date ? `Tanggal: ${date}` : "",
                        items ? `Item: ${items}` : "",
                        notes ? `Catatan: ${notes}` : "",
                      ]
                        .filter(Boolean)
                        .join("\n"),
                    },
                  },
                ],
              },
            },
          ],
        });
      } catch (notionError) {
        console.error("Notion Kanban creation failed:", notionError);
      }
    }

    /* ---- Send Telegram notification ---- */
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const escapeMd = (text: string) =>
        text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");

      const message = [
        `*Notifikasi Form Baru*`,
        ``,
        `*Tipe:* ${escapeMd(formType)}`,
        `*Nama:* ${escapeMd(name)}`,
        nim ? `*NIM:* ${escapeMd(nim)}` : "",
        department ? `*Prodi:* ${escapeMd(department)}` : "",
        reason ? `*Alasan:* ${escapeMd(reason)}` : "",
        date ? `*Tanggal:* ${escapeMd(date)}` : "",
        items ? `*Item:* ${escapeMd(items)}` : "",
        notes ? `*Catatan:* ${escapeMd(notes)}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      try {
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: "MarkdownV2",
              ...(TELEGRAM_FORMS_TOPIC_ID
                ? { message_thread_id: Number(TELEGRAM_FORMS_TOPIC_ID) }
                : {}),
            }),
          },
        );
      } catch (telegramError) {
        console.error("Telegram notification failed:", telegramError);
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
