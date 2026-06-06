import { describe, it, expect } from "vitest";
import { formatLeadMessage } from "@/lib/telegram/formatMessage";

const lead = {
  id: "lead123",
  name: "Олена Іваненко",
  email: "olena@gmail.com",
  phone: "+380971234567",
  company: "Acme LLC",
  serviceInterest: ["seo", "ads"],
  budgetRange: "5k-15k" as const,
  message: "Потрібно швидко запустити Google Ads на новий продукт.",
  utmSource: "facebook",
  utmMedium: "cpc",
  utmCampaign: "spring24",
};

const enrichment = {
  summary: "Клієнт хоче запустити Google Ads на новий продукт у стислі терміни.",
  temperature: "HOT" as const,
  intent: "google-ads-launch",
  priority: 4,
  confidence: 0.87,
  reasoning: "Конкретний продукт + бюджет + слово швидко → готовий до угоди.",
};

describe("formatLeadMessage", () => {
  it("starts with the temperature emoji + label", () => {
    const out = formatLeadMessage({ lead, enrichment, adminUrl: "https://x.test/admin" });
    expect(out).toMatch(/🔥 \*HOT LEAD\*/);
  });

  it("uses ❄️ for COLD", () => {
    const out = formatLeadMessage({
      lead,
      enrichment: { ...enrichment, temperature: "COLD" },
      adminUrl: "https://x.test/admin",
    });
    expect(out).toContain("❄️");
  });

  it("includes the masked-free escaped name", () => {
    const out = formatLeadMessage({ lead, enrichment, adminUrl: "https://x.test/admin" });
    expect(out).toContain("Олена Іваненко");
  });

  it("escapes dots in email and plus in phone", () => {
    const out = formatLeadMessage({ lead, enrichment, adminUrl: "https://x.test/admin" });
    expect(out).toContain("olena@gmail\\.com");
    expect(out).toContain("\\+380971234567");
  });

  it("includes priority and confidence percentage", () => {
    const out = formatLeadMessage({ lead, enrichment, adminUrl: "https://x.test/admin" });
    expect(out).toContain("priority 4/5");
    expect(out).toContain("confidence 87%");
  });

  it("renders the admin link", () => {
    const out = formatLeadMessage({
      lead,
      enrichment,
      adminUrl: "https://x.test/admin?id=lead123",
    });
    expect(out).toContain("https://x\\.test/admin?id\\=lead123");
  });

  it("omits utm line when all utm fields are null", () => {
    const out = formatLeadMessage({
      lead: { ...lead, utmSource: null, utmMedium: null, utmCampaign: null },
      enrichment,
      adminUrl: "https://x.test/admin",
    });
    expect(out).not.toMatch(/utm:/);
  });
});
