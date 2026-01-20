import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiClient = () => {
  // Support multiple keys via comma separation in GEMINI_API_KEYS
  // Fallback to GEMINI_API_KEY for backward compatibility
  const keysEnv =
    process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const keys = keysEnv
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k);

  if (keys.length === 0) {
    console.warn("⚠️ No GEMINI_API_KEY provided.");
    return new GoogleGenerativeAI("");
  }

  // Pick a random key
  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  // Optional: Debug log (enable locally if needed)
  // console.log(`[Gemini] Using key: ...${randomKey.slice(-4)}`);

  return new GoogleGenerativeAI(randomKey);
};
