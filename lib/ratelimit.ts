import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

type Result = { success: boolean; remaining: number; resetSeconds: number };

let cached: Ratelimit | null | "disabled" = null;

function build(): Ratelimit | "disabled" {
  const e = env();
  if (!e.UPSTASH_REDIS_REST_URL || !e.UPSTASH_REDIS_REST_TOKEN) return "disabled";
  const redis = new Redis({
    url: e.UPSTASH_REDIS_REST_URL,
    token: e.UPSTASH_REDIS_REST_TOKEN,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: false,
    prefix: "ciel:leads",
  });
}

export async function rateLimitLeads(ip: string): Promise<Result> {
  if (cached === null) cached = build();
  if (cached === "disabled") {
    return { success: true, remaining: 999, resetSeconds: 0 };
  }
  const r = await cached.limit(ip);
  return {
    success: r.success,
    remaining: r.remaining,
    resetSeconds: Math.max(0, Math.ceil((r.reset - Date.now()) / 1000)),
  };
}
