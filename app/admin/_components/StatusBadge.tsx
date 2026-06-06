const COLORS: Record<string, string> = {
  PENDING: "bg-neutral-700 text-neutral-100",
  ENRICHED: "bg-indigo-500/20 text-indigo-200",
  NOTIFIED: "bg-emerald-500/20 text-emerald-200",
  ENRICH_FAILED: "bg-rose-500/20 text-rose-200",
  NOTIFY_FAILED: "bg-amber-500/20 text-amber-200",
  HOT: "bg-rose-500/30 text-rose-100",
  WARM: "bg-amber-500/30 text-amber-100",
  COLD: "bg-sky-500/30 text-sky-100",
};

export default function Badge({ value }: { value: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium tracking-wide uppercase ${
        COLORS[value] ?? "bg-neutral-700 text-neutral-100"
      }`}
    >
      {value}
    </span>
  );
}
