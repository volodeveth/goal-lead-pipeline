import { describe, it, expect, beforeEach, vi } from "vitest";
import { testPrisma, resetLeads } from "./helpers/prisma";
import { makeNormalizedLead } from "./helpers/makeLead";
import { processLead } from "@/lib/pipeline/processLead";

const ENV_OK = !!process.env.DATABASE_URL_TEST;
const d = ENV_OK ? describe : describe.skip;

const enrichment = {
  summary: "Клієнт хоче SEO-аудит та просування нового сайту.",
  temperature: "WARM" as const,
  intent: "seo-audit",
  priority: 3,
  confidence: 0.7,
  reasoning: "Чіткий інтерес без терміновості.",
};

d("processLead (integration)", () => {
  beforeEach(async () => {
    await resetLeads();
    vi.restoreAllMocks();
  });

  it("happy path: PENDING -> ENRICHED -> NOTIFIED", async () => {
    const p = testPrisma();
    const normalized = makeNormalizedLead();
    const created = await p.lead.create({ data: { ...normalized, status: "PENDING" } });

    await processLead(created.id, {
      prisma: p,
      enrich: vi.fn().mockResolvedValue(enrichment),
      notify: vi.fn().mockResolvedValue({ messageId: "42" }),
      adminUrlFor: (id) => `https://x.test/admin?id=${id}`,
    });

    const after = await p.lead.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.status).toBe("NOTIFIED");
    expect(after.summary).toBe(enrichment.summary);
    expect(after.temperature).toBe("WARM");
    expect(after.telegramMessageId).toBe("42");
    expect(after.notifiedAt).not.toBeNull();
  });

  it("AI failure: status ENRICH_FAILED, no telegram call", async () => {
    const p = testPrisma();
    const normalized = makeNormalizedLead();
    const created = await p.lead.create({ data: { ...normalized, status: "PENDING" } });

    const notify = vi.fn();
    await processLead(created.id, {
      prisma: p,
      enrich: vi.fn().mockRejectedValue(new Error("openrouter down")),
      notify,
      adminUrlFor: (id) => `https://x.test/admin?id=${id}`,
    });

    const after = await p.lead.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.status).toBe("ENRICH_FAILED");
    expect(after.failureReason).toContain("openrouter down");
    expect(notify).not.toHaveBeenCalled();
  });

  it("Telegram failure: AI fields saved, status NOTIFY_FAILED", async () => {
    const p = testPrisma();
    const normalized = makeNormalizedLead();
    const created = await p.lead.create({ data: { ...normalized, status: "PENDING" } });

    await processLead(created.id, {
      prisma: p,
      enrich: vi.fn().mockResolvedValue(enrichment),
      notify: vi.fn().mockRejectedValue(new Error("telegram 503")),
      adminUrlFor: (id) => `https://x.test/admin?id=${id}`,
    });

    const after = await p.lead.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.status).toBe("NOTIFY_FAILED");
    expect(after.summary).toBe(enrichment.summary);
    expect(after.failureReason).toContain("telegram 503");
  });
});
