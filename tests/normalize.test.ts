import { describe, it, expect } from "vitest";
import { normalizeLead } from "@/lib/pipeline/normalize";

const baseInput = {
  name: "  Олена   Іваненко  ",
  email: "OLENA@GMAIL.com",
  phone: "+38 (097) 123-45-67",
  serviceInterest: ["SEO", "Контекстна реклама"],
  message: "  Потрібно швидко запустити Google Ads.  ",
};

describe("normalizeLead", () => {
  it("trims and collapses whitespace in name", () => {
    expect(normalizeLead(baseInput).name).toBe("Олена Іваненко");
  });

  it("lowercases and trims email", () => {
    expect(normalizeLead(baseInput).email).toBe("olena@gmail.com");
  });

  it("normalizes phone to E.164 (UA default)", () => {
    expect(normalizeLead(baseInput).phone).toBe("+380971234567");
  });

  it("accepts already-E.164 phone", () => {
    expect(normalizeLead({ ...baseInput, phone: "+380971234567" }).phone).toBe("+380971234567");
  });

  it("throws on impossible phone", () => {
    expect(() => normalizeLead({ ...baseInput, phone: "abc123" })).toThrow();
  });

  it("maps known service interests to canonical slugs", () => {
    const r = normalizeLead({
      ...baseInput,
      serviceInterest: ["SEO", "Контекстна реклама", "SMM", "Веб-розробка"],
    });
    expect(r.serviceInterest).toEqual(["seo", "ads", "smm", "web"]);
  });

  it("maps unknown service interest to other", () => {
    const r = normalizeLead({ ...baseInput, serviceInterest: ["Хмарочоси"] });
    expect(r.serviceInterest).toEqual(["other"]);
  });

  it("deduplicates service interest slugs", () => {
    const r = normalizeLead({ ...baseInput, serviceInterest: ["SEO", "seo"] });
    expect(r.serviceInterest).toEqual(["seo"]);
  });

  it("turns blank company to null", () => {
    expect(normalizeLead({ ...baseInput, company: "   " }).company).toBeNull();
  });

  it("trims message", () => {
    expect(normalizeLead(baseInput).message).toBe("Потрібно швидко запустити Google Ads.");
  });

  it("truncates message above 4000 chars", () => {
    const r = normalizeLead({ ...baseInput, message: "a".repeat(5000) });
    expect(r.message.length).toBe(4000);
  });

  it("lowercases and sanitizes utm", () => {
    const r = normalizeLead({
      ...baseInput,
      utm: { source: "  FaceBook<script> ", medium: "CPC", campaign: "Spring-24" },
    });
    expect(r.utmSource).toBe("facebookscript");
    expect(r.utmMedium).toBe("cpc");
    expect(r.utmCampaign).toBe("spring-24");
  });

  it("preserves provided requestId", () => {
    const id = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    expect(normalizeLead({ ...baseInput, requestId: id }).requestId).toBe(id);
  });

  it("generates a requestId when not provided", () => {
    const r = normalizeLead(baseInput);
    expect(r.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
