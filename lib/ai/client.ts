import OpenAI from "openai";
import { env } from "@/lib/env";

let cached: OpenAI | null = null;

export function getAiClient(): OpenAI {
  if (cached) return cached;
  const e = env();
  cached = new OpenAI({
    apiKey: e.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": e.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": e.OPENROUTER_X_TITLE,
    },
  });
  return cached;
}
