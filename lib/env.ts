import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url().optional(),
  DATABASE_URL_TEST: z.url().optional(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_HTTP_REFERER: z.url().optional(),
  OPENROUTER_X_TITLE: z.string().default("Goal Lead Pipeline"),
  OPENROUTER_MODEL: z.string().default("deepseek/deepseek-v3.2-exp"),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().min(1),
  ADMIN_USER: z.string().min(1).default("admin"),
  ADMIN_PASSWORD: z.string().min(8),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  APP_BASE_URL: z.url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment variables: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
