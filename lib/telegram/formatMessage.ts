import { escapeMarkdownV2 as esc } from "@/lib/telegram/escape";
import type { EnrichmentResult } from "@/lib/schemas/lead";

const TEMP_EMOJI = { HOT: "🔥", WARM: "🌤", COLD: "❄️" } as const;

export type FormatLeadInput = {
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string | null;
    serviceInterest: string[];
    budgetRange: string | null;
    message: string;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
  };
  enrichment: EnrichmentResult;
  adminUrl: string;
};

export function formatLeadMessage({ lead, enrichment, adminUrl }: FormatLeadInput): string {
  const emoji = TEMP_EMOJI[enrichment.temperature];
  const tempLabel = `${enrichment.temperature} LEAD`;

  const nameLine = lead.company
    ? `👤 ${esc(lead.name)} · ${esc(lead.company)}`
    : `👤 ${esc(lead.name)}`;

  const services = lead.serviceInterest.map((s) => esc(s.toUpperCase())).join(", ");
  const budgetPart = lead.budgetRange ? ` · budget ${esc(lead.budgetRange)}` : "";
  const servicesLine = `💼 ${services}${budgetPart}`;

  const utmParts = [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(
    (x): x is string => x !== null && x.length > 0,
  );
  const utmLine = utmParts.length > 0 ? `\n🌐 utm: ${esc(utmParts.join("/"))}` : "";

  const confidencePct = Math.round(enrichment.confidence * 100);

  return [
    `${emoji} *${esc(tempLabel)}* · priority ${enrichment.priority}/5`,
    "",
    nameLine,
    `📞 ${esc(lead.phone)}`,
    `📧 ${esc(lead.email)}`,
    "",
    `${servicesLine}${utmLine}`,
    "",
    `📝 ${esc(enrichment.summary)}`,
    "",
    `🎯 intent: ${esc(enrichment.intent)} · confidence ${confidencePct}%`,
    `💭 ${esc(enrichment.reasoning)}`,
    "",
    `🔗 admin: ${esc(adminUrl)}`,
  ].join("\n");
}
