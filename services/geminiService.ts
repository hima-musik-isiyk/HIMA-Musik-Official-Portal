const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY || "";

if (!apiKey) {
  console.warn("Groq API key is empty. Set GROQ_API_KEY in .env.local and restart the dev server.");
} else {
  console.info("Groq API key loaded for Groq client.");
}

type GroqChatCompletion = {
  choices: { message?: { content?: string } }[];
};

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
const groqModel = "llama-3.1-8b-instant";

export const refineAduanText = async (originalText: string): Promise<string> => {
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
              "You are a professional editor for a student organization website. Rewrite the user's complaint or suggestion in Bahasa Indonesia. Respond only with XML in this exact format: <enhanced>TEKS_HASIL_REFINEMENT</enhanced>. Do not add any other text before or after the XML. The enhanced text must be polite, constructive, formal, concise, and preserve the original meaning.",
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
      console.error("Groq API Error:", response.status, response.statusText, text);
      return originalText;
    }

    const data = JSON.parse(text) as GroqChatCompletion;
    const content = data.choices[0]?.message?.content;
    if (!content) return originalText;

    const match = content.match(/<enhanced>([\s\S]*?)<\/enhanced>/i);
    const enhanced = match ? match[1].trim() : content.trim();
    return enhanced || originalText;
  } catch (error) {
    console.error("Error refining text with Groq:", error);
    return originalText;
  }
};

export const generateCreativeManifesto = async (): Promise<string> => {
  return "Harmony in diversity, rhythm in unity.";
};
