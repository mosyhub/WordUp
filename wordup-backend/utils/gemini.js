import { GoogleGenerativeAI } from "@google/generative-ai";

export function resolveGeminiApiKey() {
  return (
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

export function getGeminiModel(modelOverride) {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Please add GOOGLE_GEMINI_API_KEY (or GEMINI_API_KEY / GOOGLE_API_KEY) to your environment."
    );
  }

  const modelName = modelOverride || process.env.GEMINI_MODEL || "gemini-2.5-pro";
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

