import { NextResponse } from "next/server";
import { after } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { RawLeadInputSchema } from "@/lib/schemas/lead";
import { normalizeLead } from "@/lib/pipeline/normalize";
import { processLead } from "@/lib/pipeline/processLead";
import { enrichLead } from "@/lib/ai/enrichLead";
import { getAiClient } from "@/lib/ai/client";
import { sendTelegramNotification } from "@/lib/telegram/notify";
import { rateLimitLeads } from "@/lib/ratelimit";
import { logger, maskEmail, maskPhone } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0];
    if (first) return first.trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function adminUrlFor(id: string): string {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${base}/admin?id=${id}`;
}

export async function POST(req: Request): Promise<Response> {
  const t0 = Date.now();
  const ip = clientIp(req);

  const rl = await rateLimitLeads(ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: "RateLimited", retryAfterSeconds: rl.resetSeconds },
      { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "ValidationError", issues: [{ path: ["body"], message: "Invalid JSON" }] },
      { status: 400 },
    );
  }

  const parsed = RawLeadInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "ValidationError",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }

  let normalized;
  try {
    normalized = normalizeLead(parsed.data);
  } catch (e) {
    return NextResponse.json(
      {
        error: "ValidationError",
        issues: [{ path: ["phone"], message: (e as Error).message }],
      },
      { status: 400 },
    );
  }

  try {
    const lead = await prisma.lead.create({
      data: { ...normalized, status: "PENDING" },
    });

    logger.info(
      {
        step: "accepted",
        leadId: lead.id,
        durationMs: Date.now() - t0,
        email: maskEmail(lead.email),
        phone: maskPhone(lead.phone),
      },
      "lead accepted",
    );

    after(async () => {
      const t1 = Date.now();
      try {
        const e = env();
        const aiClient = getAiClient();
        await processLead(lead.id, {
          prisma,
          enrich: (l) => enrichLead(l, { client: aiClient, model: e.OPENROUTER_MODEL }),
          notify: (input) =>
            sendTelegramNotification({
              ...input,
              botToken: e.TELEGRAM_BOT_TOKEN,
              chatId: e.TELEGRAM_CHAT_ID,
            }),
          adminUrlFor,
        });
        logger.info(
          { step: "processed", leadId: lead.id, durationMs: Date.now() - t1 },
          "lead processed",
        );
      } catch (err) {
        logger.error(
          { step: "process-error", leadId: lead.id, err: (err as Error).message },
          "background processing failed",
        );
      }
    });

    return NextResponse.json(
      { id: lead.id, status: "accepted", message: "Заявку прийнято" },
      { status: 202 },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await prisma.lead.findUnique({
        where: { requestId: normalized.requestId },
        select: { id: true },
      });
      return NextResponse.json(
        { error: "DuplicateRequest", id: existing?.id ?? null },
        { status: 409 },
      );
    }
    logger.error({ step: "create", err: (e as Error).message }, "failed to persist lead");
    return NextResponse.json({ error: "InternalError" }, { status: 500 });
  }
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const temperature = url.searchParams.get("temperature");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const where: Prisma.LeadWhereInput = {};
  if (status) where.status = status as Prisma.LeadWhereInput["status"];
  if (temperature) where.temperature = temperature as Prisma.LeadWhereInput["temperature"];

  const items = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ items, total: items.length });
}
