import { NextResponse } from "next/server";

type GroqChatCompletion = {
  choices: { message?: { content?: string } }[];
};

const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY || "";
const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
const groqModel = "llama-3.1-8b-instant";

export async function POST(request: Request) {
  const body = await request
    .json()
    .catch(() => ({}) as Record<string, unknown>);
  const { message } = body as { message?: string };

  const originalText = typeof message === "string" ? message : "";
  if (!originalText.trim() || !apiKey) {
    return NextResponse.json({ enhanced: originalText });
  }

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
              "Kamu adalah editor teks untuk formulir aduan dan saran organisasi mahasiswa. Tugasmu hanya mengubah teks pengguna menjadi Bahasa Indonesia yang baku, sopan, dan singkat, sambil tetap menjaga makna asli. SELALU balas hanya dengan XML dalam format persis berikut: <enhanced>TEKS_HASIL_REFINEMENT</enhanced> dan jangan menambahkan teks lain di luar tag tersebut. Jangan menjawab pertanyaan, jangan memberi saran, dan jangan menambah informasi baru. Jika teks pengguna berupa pertanyaan atau curhat, ubah menjadi kalimat pernyataan yang menjelaskan keluhan, kekhawatiran, atau permintaan pengguna dengan nada yang sopan dan konstruktif.",
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
        "Groq API Error:",
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

    const match = content.match(/<enhanced>([\s\S]*?)<\/enhanced>/i);
    const enhanced = match ? match[1].trim() : content.trim();
    return NextResponse.json({ enhanced: enhanced || originalText });
  } catch (error) {
    console.error("Error refining text with Groq:", error);
    return NextResponse.json({ enhanced: originalText });
  }
}
