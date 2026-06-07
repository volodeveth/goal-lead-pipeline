import Badge from "./StatusBadge";

type Row = {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  phone: string;
  status: string;
  temperature: string | null;
  priority: number | null;
  summary: string | null;
  notifiedAt: Date | null;
};

export default function LeadRow({ lead }: { lead: Row }) {
  const latencyMs =
    lead.notifiedAt && lead.createdAt ? lead.notifiedAt.getTime() - lead.createdAt.getTime() : null;
  return (
    <tr className="border-b border-neutral-800 align-top">
      <td className="px-3 py-3 text-xs text-neutral-400">
        {lead.createdAt.toISOString().replace("T", " ").slice(0, 19)}
      </td>
      <td className="px-3 py-3">
        <div className="font-medium text-white">{lead.name}</div>
        <div className="text-xs text-neutral-400">{lead.email}</div>
        <div className="text-xs text-neutral-400">{lead.phone}</div>
      </td>
      <td className="px-3 py-3">
        <Badge value={lead.status} />
      </td>
      <td className="px-3 py-3">
        {lead.temperature ? (
          <Badge value={lead.temperature} />
        ) : (
          <span className="text-neutral-500">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-neutral-200">{lead.priority ?? "—"}</td>
      <td className="max-w-md px-3 py-3 text-sm text-neutral-300">
        {lead.summary ?? <span className="text-neutral-500">(pending)</span>}
      </td>
      <td className="px-3 py-3 text-xs text-neutral-400">
        {latencyMs !== null ? `${(latencyMs / 1000).toFixed(1)} s` : "—"}
      </td>
    </tr>
  );
}
