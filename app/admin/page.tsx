import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import LeadRow from "./_components/LeadRow";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; temperature?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { status, temperature } = await searchParams;

  const where: Prisma.LeadWhereInput = {};
  if (status) where.status = status as Prisma.LeadWhereInput["status"];
  if (temperature) where.temperature = temperature as Prisma.LeadWhereInput["temperature"];

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const filters = [
    { label: "All", href: "/admin" },
    { label: "Pending", href: "/admin?status=PENDING" },
    { label: "Enriched", href: "/admin?status=ENRICHED" },
    { label: "Notified", href: "/admin?status=NOTIFIED" },
    { label: "Failed", href: "/admin?status=ENRICH_FAILED" },
    { label: "Hot", href: "/admin?temperature=HOT" },
    { label: "Warm", href: "/admin?temperature=WARM" },
    { label: "Cold", href: "/admin?temperature=COLD" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Leads</h1>
        <span className="text-xs text-neutral-400">{leads.length} item(s)</span>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-amber-400 hover:text-amber-200"
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/40">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-xs tracking-wide text-neutral-400 uppercase">
            <tr>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Contact</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Temp.</th>
              <th className="px-3 py-3">Pri.</th>
              <th className="px-3 py-3">Summary</th>
              <th className="px-3 py-3">Latency</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <LeadRow key={l.id} lead={l} />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
