import { describe, it, expect, vi } from "vitest";
import { enrichLead } from "@/lib/ai/enrichLead";

const lead = {
  requestId: "uuid",
  name: "Олена",
  email: "olena@gmail.com",
  phone: "+380971234567",
  company: null,
  serviceInterest: ["seo"],
  budgetRange: "5k-15k" as const,
  message: "Хочу SEO для нового сайту.",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
};

const validJson = JSON.stringify({
  summary: "Клієнт хоче SEO-аудит та просування нового сайту з бюджетом 5-15к.",
  temperature: "WARM",
  intent: "seo-audit",
  priority: 3,
  confidence: 0.75,
  reasoning: "Чіткий запит SEO + бюджет, але без терміновості — WARM.",
});

function makeClient(responses: Array<{ content: string } | Error>): {
  chat: { completions: { create: ReturnType<typeof vi.fn> } };
} {
  const create = vi.fn();
  for (const r of responses) {
    if (r instanceof Error) create.mockRejectedValueOnce(r);
    else create.mockResolvedValueOnce({ choices: [{ message: { content: r.content } }] });
  }
  return { chat: { completions: { create } } };
}

describe("enrichLead", () => {
  it("returns parsed enrichment on happy path", async () => {
    const client = makeClient([{ content: validJson }]);
    const r = await enrichLead(lead, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: client as any,
      model: "deepseek-test",
    });
    expect(r.temperature).toBe("WARM");
    expect(r.intent).toBe("seo-audit");
  });

  it("retries with hint when first response is invalid JSON", async () => {
    const client = makeClient([{ content: "not json" }, { content: validJson }]);
    const r = await enrichLead(lead, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: client as any,
      model: "deepseek-test",
      schemaRetries: 1,
    });
    expect(r.temperature).toBe("WARM");
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it("retries with hint when schema validation fails", async () => {
    const bad = JSON.stringify({ summary: "short", temperature: "MAYBE" });
    const client = makeClient([{ content: bad }, { content: validJson }]);
    const r = await enrichLead(lead, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: client as any,
      model: "deepseek-test",
      schemaRetries: 1,
    });
    expect(r.temperature).toBe("WARM");
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it("throws AIEnrichmentError after exhausting schema retries", async () => {
    const client = makeClient([{ content: "garbage" }, { content: "still garbage" }]);
    await expect(
      enrichLead(lead, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client: client as any,
        model: "deepseek-test",
        schemaRetries: 1,
        networkRetries: 0,
      }),
    ).rejects.toThrow(/AIEnrichmentError|Schema retries/);
  });

  it("propagates AIEnrichmentError on network errors after retries", async () => {
    const client = makeClient([new Error("ECONNRESET"), new Error("ECONNRESET")]);
    await expect(
      enrichLead(lead, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client: client as any,
        model: "deepseek-test",
        networkRetries: 1,
        minTimeoutMs: 1,
      }),
    ).rejects.toThrow(/AIEnrichmentError|ECONNRESET/);
  });
});
