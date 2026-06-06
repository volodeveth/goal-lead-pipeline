import type { PrismaClient } from "@prisma/client";
import type { EnrichmentResult, NormalizedLead } from "@/lib/schemas/lead";

export type ProcessLeadDeps = {
  prisma: PrismaClient;
  enrich: (lead: NormalizedLead) => Promise<EnrichmentResult>;
  notify: (input: {
    lead: NormalizedLead & { id: string };
    enrichment: EnrichmentResult;
    adminUrl: string;
  }) => Promise<{ messageId: string }>;
  adminUrlFor: (id: string) => string;
};

export async function processLead(leadId: string, deps: ProcessLeadDeps): Promise<void> {
  const { prisma, enrich, notify, adminUrlFor } = deps;

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  const normalized: NormalizedLead = {
    requestId: lead.requestId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    serviceInterest: lead.serviceInterest,
    budgetRange: lead.budgetRange as NormalizedLead["budgetRange"],
    message: lead.message,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
  };

  let enrichment: EnrichmentResult;
  try {
    enrichment = await enrich(normalized);
  } catch (e) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "ENRICH_FAILED",
        failureReason: (e as Error).message.slice(0, 500),
      },
    });
    return;
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "ENRICHED",
      summary: enrichment.summary,
      temperature: enrichment.temperature,
      intent: enrichment.intent,
      priority: enrichment.priority,
      confidence: enrichment.confidence,
      reasoning: enrichment.reasoning,
      enrichedAt: new Date(),
      failureReason: null,
    },
  });

  try {
    const { messageId } = await notify({
      lead: { ...normalized, id: leadId },
      enrichment,
      adminUrl: adminUrlFor(leadId),
    });
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "NOTIFIED",
        notifiedAt: new Date(),
        telegramMessageId: messageId,
        failureReason: null,
      },
    });
  } catch (e) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "NOTIFY_FAILED",
        failureReason: (e as Error).message.slice(0, 500),
      },
    });
  }
}
