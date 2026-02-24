import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const sanitize = (str: string) =>
  str.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");

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

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const topicIdRaw =
      process.env.TELEGRAM_ADUAN_TOPIC_ID ?? process.env.TELEGRAM_TOPIC_ID;

    if (!token || !chatId) {
      console.error("Missing environment variables:", {
        hasToken: !!token,
        hasChatId: !!chatId,
      });
      return NextResponse.json(
        { error: "Server misconfiguration: Missing env variables" },
        { status: 500 },
      );
    }

    const safeName = sanitize(
      typeof name === "string" && name.trim() ? name : "Anonim",
    );
    const safeNim = sanitize(typeof nim === "string" && nim.trim() ? nim : "-");
    const safeCategory = sanitize(
      typeof category === "string" && category.trim() ? category : "Umum",
    );
    const safeMessage = sanitize(message.trim());

    const text = [
      "📢 *ADUAN BARU MASUK*",
      "──────────────────",
      `👤 *Nama:* ${safeName}`,
      `🆔 *NIM:* ${safeNim}`,
      `📂 *Kategori:* ${safeCategory}`,
      "",
      "📝 *Pesan:*",
      safeMessage,
    ].join("\n");

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    const topicId = topicIdRaw ? Number(topicIdRaw) : undefined;
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "MarkdownV2",
    };

    if (
      typeof topicId === "number" &&
      Number.isInteger(topicId) &&
      topicId !== 0
    ) {
      payload.message_thread_id = topicId;
    }

    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Telegram API Error:", { status: response.status, data });
      return NextResponse.json(
        { error: "Failed to send to Telegram", details: data },
        { status: 500 },
      );
    }

    try {
      await prisma.aduan.create({
        data: {
          name: typeof name === "string" && name.trim() ? name.trim() : null,
          nim: typeof nim === "string" && nim.trim() ? nim.trim() : null,
          category: typeof category === "string" && category.trim() ? category.trim() : "Umum",
          message: message.trim(),
        },
      });
    } catch (dbError) {
      console.error("DB write failed (aduan):", dbError);

      const errorToken = process.env.TELEGRAM_BOT_TOKEN;
      const errorChatId = process.env.TELEGRAM_CHAT_ID;
      const errorTopicId = process.env.TELEGRAM_ERROR_TOPIC_ID;

      if (errorToken && errorChatId) {
        const errorText = [
          "\u26a0\ufe0f *DB WRITE FAILED \\- ADUAN*",
          "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
          `\ud83d\udce2 *Kategori:* ${safeCategory}`,
          `\ud83d\udc64 *Nama:* ${safeName}`,
          "",
          "\u2757 Telegram berhasil terkirim tetapi data TIDAK tersimpan di database\\.",
          "Manual data entry required\\.",
        ].join("\n");

        const errorPayload: Record<string, unknown> = {
          chat_id: errorChatId,
          text: errorText,
          parse_mode: "MarkdownV2",
        };

        const topicId = errorTopicId ? Number(errorTopicId) : undefined;
        if (typeof topicId === "number" && Number.isInteger(topicId) && topicId !== 0) {
          errorPayload.message_thread_id = topicId;
        }

        try {
          await fetch(`https://api.telegram.org/bot${errorToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(errorPayload),
          });
        } catch (telegramError) {
          console.error("Failed to send DB error notification to Telegram:", telegramError);
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
