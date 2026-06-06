import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      summary: true,
      temperature: true,
      intent: true,
      priority: true,
      confidence: true,
      reasoning: true,
    },
  });
  if (!lead) {
    return NextResponse.json({ error: "NotFound" }, { status: 404 });
  }
  return NextResponse.json({
    id: lead.id,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
    summary: lead.summary,
    classification:
      lead.temperature !== null
        ? {
            temperature: lead.temperature,
            intent: lead.intent,
            priority: lead.priority,
            confidence: lead.confidence,
            reasoning: lead.reasoning,
          }
        : null,
  });
}
