import OpenAI from "openai";
import { env } from "@/lib/env";

let cached: OpenAI | null = null;

// HTTP headers must be ASCII (ByteString). Replace anything outside [\x20-\x7E].
function asciiHeader(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "?");
}

export function getAiClient(): OpenAI {
  if (cached) return cached;
  const e = env();
  cached = new OpenAI({
    apiKey: e.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": asciiHeader(e.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000"),
      "X-Title": asciiHeader(e.OPENROUTER_X_TITLE),
    },
  });
  return cached;
}
