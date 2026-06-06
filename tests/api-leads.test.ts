import { describe, it, expect, beforeEach, vi } from "vitest";
import { testPrisma, resetLeads } from "./helpers/prisma";

const ENV_OK = !!process.env.DATABASE_URL_TEST;
const d = ENV_OK ? describe : describe.skip;

async function importHandler() {
  vi.stubEnv("DATABASE_URL", process.env.DATABASE_URL_TEST!);
  vi.stubEnv("OPENROUTER_API_KEY", "test");
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "test");
  vi.stubEnv("TELEGRAM_CHAT_ID", "test");
  vi.stubEnv("ADMIN_PASSWORD", "longpassword");
  return await import("@/app/api/leads/route");
}

const validBody = {
  name: "Олена Іваненко",
  email: "olena@gmail.com",
  phone: "+380971234567",
  serviceInterest: ["SEO"],
  message: "Хочу SEO-аудит для нового сайту.",
};

d("POST /api/leads", () => {
  beforeEach(async () => {
    await resetLeads();
    vi.restoreAllMocks();
  });

  it("returns 202 with id on valid payload", async () => {
    const { POST } = await importHandler();
    const req = new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.status).toBe("accepted");

    const lead = await testPrisma().lead.findUniqueOrThrow({ where: { id: body.id } });
    expect(lead.email).toBe("olena@gmail.com");
    expect(lead.status).toBe("PENDING");
  });

  it("returns 400 on invalid email", async () => {
    const { POST } = await importHandler();
    const req = new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validBody, email: "not-email" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("ValidationError");
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it("returns 409 on duplicate requestId", async () => {
    const { POST } = await importHandler();
    const rid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

    const first = await POST(
      new Request("http://localhost/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...validBody, requestId: rid }),
      }),
    );
    expect(first.status).toBe(202);
    const firstBody = await first.json();

    const second = await POST(
      new Request("http://localhost/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...validBody, requestId: rid }),
      }),
    );
    expect(second.status).toBe(409);
    const secondBody = await second.json();
    expect(secondBody.id).toBe(firstBody.id);
  });

  it("returns 400 on malformed JSON", async () => {
    const { POST } = await importHandler();
    const req = new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
