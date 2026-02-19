import { NextResponse } from 'next/server';

const sanitize = (str: string) => str.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const { name, nim, category, message } = body as Record<string, unknown>;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const topicIdRaw = process.env.TELEGRAM_TOPIC_ID;

  if (!token || !chatId) {
    return NextResponse.json(
      { error: 'Server misconfiguration: Missing env variables' },
      { status: 500 }
    );
  }

  const safeName = sanitize(typeof name === 'string' && name.trim() ? name : 'Anonim');
  const safeNim = sanitize(typeof nim === 'string' && nim.trim() ? nim : '-');
  const safeCategory = sanitize(typeof category === 'string' && category.trim() ? category : 'Umum');
  const safeMessage = sanitize(typeof message === 'string' && message.trim() ? message : '-');

  const text = [
    '📢 *ADUAN BARU MASUK*',
    '──────────────────',
    `👤 *Nama:* ${safeName}`,
    `🆔 *NIM:* ${safeNim}`,
    `📂 *Kategori:* ${safeCategory}`,
    '',
    '📝 *Pesan:*',
    safeMessage,
  ].join('\n');

  try {
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    const topicId = topicIdRaw ? Number(topicIdRaw) : undefined;
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
    };

    if (typeof topicId === 'number' && Number.isInteger(topicId) && topicId !== 0) {
      payload.message_thread_id = topicId;
    }

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telegram API Error:', data);
      return NextResponse.json({ error: 'Failed to send to Telegram' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

