import pRetry from "p-retry";
import type OpenAI from "openai";
import { EnrichmentSchema, type EnrichmentResult, type NormalizedLead } from "@/lib/schemas/lead";
import { AIEnrichmentError } from "@/lib/errors";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";

export type EnrichLeadOptions = {
  client: OpenAI;
  model: string;
  schemaRetries?: number;
  networkRetries?: number;
  minTimeoutMs?: number;
};

async function callOnce(client: OpenAI, model: string, userPrompt: string): Promise<string> {
  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 600,
    response_format: { type: "json_object" },
  });
  return res.choices[0]?.message?.content ?? "";
}

type ParseResult = { ok: true; data: EnrichmentResult } | { ok: false; reason: string };

function tryParse(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, reason: `invalid JSON: ${(e as Error).message}` };
  }
  const r = EnrichmentSchema.safeParse(parsed);
  if (!r.success) {
    return { ok: false, reason: `schema: ${r.error.issues.map((i) => i.message).join("; ")}` };
  }
  return { ok: true, data: r.data };
}

export async function enrichLead(
  lead: NormalizedLead,
  opts: EnrichLeadOptions,
): Promise<EnrichmentResult> {
  const { client, model, schemaRetries = 1, networkRetries = 3, minTimeoutMs = 500 } = opts;

  const basePrompt = buildUserPrompt(lead as unknown as Record<string, unknown>);

  try {
    return await pRetry(
      async () => {
        let userPrompt = basePrompt;
        let lastReason = "";

        for (let attempt = 0; attempt <= schemaRetries; attempt++) {
          const raw = await callOnce(client, model, userPrompt);
          const parsed = tryParse(raw);
          if (parsed.ok) return parsed.data;

          lastReason = parsed.reason;
          userPrompt =
            `${basePrompt}\n\nPrevious response failed validation: ${parsed.reason}. ` +
            `Return valid JSON matching the schema only.`;
        }

        throw new AIEnrichmentError(`Schema retries exhausted: ${lastReason}`);
      },
      { retries: networkRetries, minTimeout: minTimeoutMs, factor: 2 },
    );
  } catch (err) {
    if (err instanceof AIEnrichmentError) throw err;
    throw new AIEnrichmentError(`Network/runtime: ${(err as Error).message}`, err);
  }
}
