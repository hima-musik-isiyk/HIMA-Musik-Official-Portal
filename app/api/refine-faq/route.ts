import { NextResponse } from "next/server";

import { logErrorToDiscord } from "@/lib/discord";
import { extractEnhancedText } from "@/services/refineParser";

type GroqChatCompletion = {
  choices: { message?: { content?: string } }[];
};

const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY || "";
const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
const groqModel = "llama-3.1-8b-instant";
const groqCooldownMs = 15000;

const groqLastCall = new Map<string, number>();

const getClientIdentifier = (request: Request): string => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[0] as string;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const userAgent = request.headers.get("user-agent") || "unknown";
  return `ua:${userAgent}`;
};

export async function POST(request: Request) {
  const body = await request
    .json()
    .catch(() => ({}) as Record<string, unknown>);
  const { question } = body as { question?: string };

  const originalText = typeof question === "string" ? question : "";
  if (!originalText.trim() || !apiKey) {
    return NextResponse.json({ enhanced: originalText });
  }

  const now = Date.now();
  const identifier = getClientIdentifier(request);
  const lastCall = groqLastCall.get(identifier) ?? 0;
  const elapsed = now - lastCall;

  if (elapsed < groqCooldownMs) {
    const retryAfterMs = groqCooldownMs - elapsed;
    return NextResponse.json(
      {
        enhanced: originalText,
        error: "Too many requests. Please wait before trying again.",
        retryAfterMs,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        },
      },
    );
  }

  groqLastCall.set(identifier, now);

  try {
    const response = await fetch(groqEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah editor teks untuk formulir pertanyaan (FAQ) organisasi mahasiswa HIMA Musik. Tugasmu hanya mengubah teks pertanyaan pengguna menjadi pertanyaan Bahasa Indonesia yang baku, sopan, singkat, padat, dan jelas, sambil tetap menjaga makna asli. SELALU balas hanya dengan XML dalam format persis berikut: <enhanced>TEKS_HASIL_REFINEMENT</enhanced> dan jangan menambahkan teks lain di luar tag tersebut. Jangan menjawab pertanyaan, jangan memberi saran, dan jangan menambah informasi baru. Jika teks pengguna terlalu santai, tidak baku, atau bertele-tele, ubah menjadi kalimat tanya yang jelas, sopan, dan formal.",
          },
          {
            role: "user",
            content: originalText,
          },
        ],
        temperature: 0.4,
        max_tokens: 256,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error(
        "Groq API Error (FAQ):",
        response.status,
        response.statusText,
        text,
      );
      return NextResponse.json({ enhanced: originalText });
    }

    const data = JSON.parse(text) as GroqChatCompletion;
    const content = data.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ enhanced: originalText });
    }

    const enhanced = extractEnhancedText(content, originalText);
    return NextResponse.json({ enhanced: enhanced || originalText });
  } catch (error) {
    console.error("Error refining FAQ text with Groq:", error);
    await logErrorToDiscord(error, "Groq AI Refine FAQ API");
    return NextResponse.json({ enhanced: originalText });
  }
}
