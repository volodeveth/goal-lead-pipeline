import { parsePhoneNumberFromString } from "libphonenumber-js";
import { v4 as uuidv4 } from "uuid";
import type { RawLeadInput, NormalizedLead, BudgetRange } from "@/lib/schemas/lead";

const SERVICE_SLUG_MAP: Record<string, string> = {
  seo: "seo",
  "контекстна реклама": "ads",
  контекстна: "ads",
  ads: "ads",
  smm: "smm",
  "веб-розробка": "web",
  web: "web",
  "веб розробка": "web",
};

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function slugifyService(raw: string): string {
  const key = raw.toLowerCase().trim();
  return SERVICE_SLUG_MAP[key] ?? "other";
}

function sanitizeUtm(value: string | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  return cleaned.length ? cleaned : null;
}

export function normalizeLead(input: RawLeadInput): NormalizedLead {
  const phone = parsePhoneNumberFromString(input.phone, "UA");
  if (!phone || !phone.isValid()) {
    throw new Error(`Cannot parse phone number: ${input.phone}`);
  }

  const slugs = Array.from(new Set(input.serviceInterest.map(slugifyService)));

  const company = input.company ? input.company.trim() : "";

  const trimmedMsg = input.message.trim();
  const message = trimmedMsg.length > 4000 ? trimmedMsg.slice(0, 4000) : trimmedMsg;

  return {
    requestId: input.requestId ?? uuidv4(),
    name: collapseWhitespace(input.name),
    email: input.email.trim().toLowerCase(),
    phone: phone.format("E.164"),
    company: company.length ? company : null,
    serviceInterest: slugs,
    budgetRange: (input.budgetRange ?? null) as BudgetRange | null,
    message,
    utmSource: sanitizeUtm(input.utm?.source),
    utmMedium: sanitizeUtm(input.utm?.medium),
    utmCampaign: sanitizeUtm(input.utm?.campaign),
  };
}
