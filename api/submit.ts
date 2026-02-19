const sanitize = (str: string) =>
  str.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");

type SubmitRequest = {
  method?: string;
  body?: Record<string, unknown>;
};

type SubmitResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: Record<string, unknown>) => void;
  };
};

export default async function handler(req: SubmitRequest, res: SubmitResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, nim, category, message } =
    (req.body as Record<string, unknown>) || {};

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const topicIdRaw = process.env.TELEGRAM_TOPIC_ID;

  if (!token || !chatId) {
    return res
      .status(500)
      .json({ error: "Server misconfiguration: Missing env variables" });
  }

  const safeName = sanitize(
    typeof name === "string" && name.trim() ? name : "Anonim",
  );
  const safeNim = sanitize(typeof nim === "string" && nim.trim() ? nim : "-");
  const safeCategory = sanitize(
    typeof category === "string" && category.trim() ? category : "Umum",
  );
  const safeMessage = sanitize(
    typeof message === "string" && message.trim() ? message : "-",
  );

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

  try {
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
      console.error("Telegram API Error:", data);
      return res.status(500).json({ error: "Failed to send to Telegram" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
