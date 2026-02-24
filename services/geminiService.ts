import { extractEnhancedText } from "@/services/refineParser";

const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY || "";

if (!apiKey) {
  console.warn(
    "Groq API key is empty. Set GROQ_API_KEY in .env.local and restart the dev server.",
  );
}

type GroqChatCompletion = {
  choices: { message?: { content?: string } }[];
};

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
const groqModel = "llama-3.1-8b-instant";

export const refineAduanText = async (
  originalText: string,
): Promise<string> => {
  if (!originalText.trim()) return originalText;

  if (!apiKey) {
    return originalText;
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
      return originalText;
    }

    const data = JSON.parse(text) as GroqChatCompletion;
    const content = data.choices[0]?.message?.content;
    if (!content) return originalText;

    const enhanced = extractEnhancedText(content, originalText);
    return enhanced || originalText;
  } catch (error) {
    console.error("Error refining text with Groq:", error);
    return originalText;
  }
};

export const generateCreativeManifesto = async (): Promise<string> => {
  return "Harmony in diversity, rhythm in unity.";
};
