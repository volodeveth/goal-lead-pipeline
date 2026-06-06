import { PrismaClient } from "@prisma/client";

let cached: PrismaClient | null = null;

export function testPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    throw new Error("DATABASE_URL_TEST is required for integration tests");
  }
  if (!cached) {
    cached = new PrismaClient({ datasources: { db: { url } } });
  }
  return cached;
}

export async function resetLeads(): Promise<void> {
  const p = testPrisma();
  await p.lead.deleteMany();
}
