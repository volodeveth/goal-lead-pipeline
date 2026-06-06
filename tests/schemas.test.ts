import { describe, it, expect } from "vitest";
import { RawLeadInputSchema, EnrichmentSchema } from "@/lib/schemas/lead";

describe("RawLeadInputSchema", () => {
  const valid = {
    name: "Олена Іваненко",
    email: "olena@gmail.com",
    phone: "+380971234567",
    serviceInterest: ["SEO"],
    budgetRange: "5k-15k",
    message: "Хочу запустити Google Ads на новий продукт",
  };

  it("accepts a minimal valid payload", () => {
    expect(RawLeadInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    const r = RawLeadInputSchema.safeParse({ ...valid, name: "" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = RawLeadInputSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rejects empty phone", () => {
    const r = RawLeadInputSchema.safeParse({ ...valid, phone: "" });
    expect(r.success).toBe(false);
  });

  it("rejects message shorter than 5 chars", () => {
    const r = RawLeadInputSchema.safeParse({ ...valid, message: "hi" });
    expect(r.success).toBe(false);
  });

  it("rejects message longer than 4000 chars", () => {
    const r = RawLeadInputSchema.safeParse({ ...valid, message: "a".repeat(4001) });
    expect(r.success).toBe(false);
  });

  it("accepts optional utm and company and requestId", () => {
    const r = RawLeadInputSchema.safeParse({
      ...valid,
      requestId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      company: "Acme",
      utm: { source: "facebook", medium: "cpc", campaign: "spring24" },
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-uuid requestId", () => {
    const r = RawLeadInputSchema.safeParse({ ...valid, requestId: "not-a-uuid" });
    expect(r.success).toBe(false);
  });

  it("requires at least one serviceInterest", () => {
    const r = RawLeadInputSchema.safeParse({ ...valid, serviceInterest: [] });
    expect(r.success).toBe(false);
  });
});

describe("EnrichmentSchema", () => {
  const valid = {
    summary: "Клієнт хоче швидко запустити Google Ads на новий продукт.",
    temperature: "HOT" as const,
    intent: "google-ads-launch",
    priority: 4,
    confidence: 0.87,
    reasoning: "Конкретний продукт + бюджет + слово швидко → готовий до угоди.",
  };

  it("accepts a valid enrichment", () => {
    expect(EnrichmentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects bad temperature", () => {
    const r = EnrichmentSchema.safeParse({ ...valid, temperature: "LUKEWARM" });
    expect(r.success).toBe(false);
  });

  it("rejects priority out of range", () => {
    expect(EnrichmentSchema.safeParse({ ...valid, priority: 0 }).success).toBe(false);
    expect(EnrichmentSchema.safeParse({ ...valid, priority: 6 }).success).toBe(false);
  });

  it("rejects confidence out of [0,1]", () => {
    expect(EnrichmentSchema.safeParse({ ...valid, confidence: -0.1 }).success).toBe(false);
    expect(EnrichmentSchema.safeParse({ ...valid, confidence: 1.1 }).success).toBe(false);
  });
});
