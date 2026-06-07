import { PrismaClient } from "@prisma/client";

const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/debug-lead.mjs <leadId>");
  process.exit(1);
}

const p = new PrismaClient();
const lead = await p.lead.findUnique({ where: { id } });
console.log(JSON.stringify(lead, null, 2));
await p.$disconnect();
