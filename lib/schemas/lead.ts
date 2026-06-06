import { z } from "zod";

export const BudgetRangeEnum = z.enum(["<1k", "1k-5k", "5k-15k", "15k-50k", ">50k", "not_sure"]);
export type BudgetRange = z.infer<typeof BudgetRangeEnum>;

const UtmSchema = z
  .object({
    source: z.string().max(80).optional(),
    medium: z.string().max(80).optional(),
    campaign: z.string().max(80).optional(),
  })
  .optional();

export const RawLeadInputSchema = z.object({
  requestId: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  phone: z.string().trim().min(1).max(40),
  company: z.string().trim().max(120).optional(),
  serviceInterest: z.array(z.string().min(1).max(80)).min(1).max(10),
  budgetRange: BudgetRangeEnum.optional(),
  message: z.string().trim().min(5).max(4000),
  utm: UtmSchema,
});

export type RawLeadInput = z.infer<typeof RawLeadInputSchema>;

export const TemperatureEnum = z.enum(["HOT", "WARM", "COLD"]);
export type Temperature = z.infer<typeof TemperatureEnum>;

export const EnrichmentSchema = z.object({
  summary: z.string().trim().min(20).max(500),
  temperature: TemperatureEnum,
  intent: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "intent must be lowercase kebab-case"),
  priority: z.number().int().min(1).max(5),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().trim().min(20).max(400),
});

export type EnrichmentResult = z.infer<typeof EnrichmentSchema>;

export type NormalizedLead = {
  requestId: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  serviceInterest: string[];
  budgetRange: BudgetRange | null;
  message: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};
