import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendTelegramNotification } from "@/lib/telegram/notify";

const lead = {
  id: "lead123",
  name: "Олена",
  email: "olena@gmail.com",
  phone: "+380971234567",
  company: null,
  serviceInterest: ["seo"],
  budgetRange: null,
  message: "Хочу SEO для нового сайту.",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
};

const enrichment = {
  summary: "Клієнт шукає SEO для нового сайту і готовий розглянути пропозиції.",
  temperature: "WARM" as const,
  intent: "seo-audit",
  priority: 3,
  confidence: 0.7,
  reasoning: "Запитує SEO без конкретного бюджету — інтерес є, без терміновості.",
};

const config = {
  botToken: "TEST_TOKEN",
  chatId: "12345",
  adminUrl: "https://x.test/admin?id=lead123",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("sendTelegramNotification", () => {
  it("returns the messageId on 200", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const r = await sendTelegramNotification({ lead, enrichment, ...config });
    expect(r.messageId).toBe("42");
    expect(fetchMock).toHaveBeenCalledOnce();

    const call = fetchMock.mock.calls[0]!;
    const url = call[0] as string;
    const init = call[1] as RequestInit;
    expect(url).toContain("/botTEST_TOKEN/sendMessage");
    const body = JSON.parse(init.body as string);
    expect(body.chat_id).toBe("12345");
    expect(body.parse_mode).toBe("MarkdownV2");
    expect(body.text).toContain("WARM");
  });

  it("retries on 500 then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("oops", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, result: { message_id: 7 } }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const r = await sendTelegramNotification({
      lead,
      enrichment,
      ...config,
      retries: 2,
      minTimeoutMs: 1,
    });
    expect(r.messageId).toBe("7");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fast-fails on 400 (no retry)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: false, description: "Bad" }), { status: 400 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendTelegramNotification({ lead, enrichment, ...config, retries: 3, minTimeoutMs: 1 }),
    ).rejects.toThrow(/Telegram/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("throws TelegramError after exhausting retries on 5xx", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response("boom", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendTelegramNotification({ lead, enrichment, ...config, retries: 2, minTimeoutMs: 1 }),
    ).rejects.toThrow(/Telegram/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
