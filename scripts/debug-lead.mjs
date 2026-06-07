import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/debug-lead.mjs <leadId>");
  process.exit(1);
}

const p = new PrismaClient();
const lead = await p.lead.findUnique({ where: { id } });

if (!lead) {
  console.error("Lead not found");
  process.exit(1);
}

writeFileSync("scripts/debug-lead.out.json", JSON.stringify(lead, null, 2), { encoding: "utf-8" });

const nameCodepoints = [...lead.name].map((c) => c.codePointAt(0).toString(16)).join(" ");
console.log("name length:", lead.name.length);
console.log("name codepoints:", nameCodepoints);
console.log("name (utf-8 hex):", Buffer.from(lead.name, "utf-8").toString("hex"));
console.log("expected 'Олена Іваненко' codepoints: 41e 43b 435 43d 430 20 406 432 430 43d 435 43d 43a 43e");
console.log("---");
console.log("Wrote full lead to scripts/debug-lead.out.json (UTF-8)");

await p.$disconnect();
