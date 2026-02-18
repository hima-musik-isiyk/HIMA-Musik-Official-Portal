import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const refineAduanText = async (originalText: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing.");
    return originalText;
  }
  
  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are a professional editor for a student organization website.
      Rewrite the following complaint or suggestion to be more constructive, professional, and clear, 
      while maintaining the original intent. Keep it concise.
      
      Original text: "${originalText}"
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || originalText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return originalText;
  }
};

export const generateCreativeManifesto = async (): Promise<string> => {
    if (!apiKey) return "Music is the silence between the notes.";
    
    try {
        const model = 'gemini-3-flash-preview';
        const prompt = "Generate a single, profound, short philosophical sentence about the power of music and community. Do not use quotes.";
         const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text?.trim() || "Harmony in diversity, rhythm in unity.";
    } catch (e) {
        return "Harmony in diversity, rhythm in unity.";
    }
}
