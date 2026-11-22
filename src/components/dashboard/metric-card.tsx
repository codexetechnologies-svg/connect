type MetricCardProps = {
  label: string;
  value: string;
  accent: string;
};

export function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className="card p-5">
      <div className={`mb-4 h-2.5 w-16 rounded-full ${accent}`} />
      <div className="text-3xl font-black text-[#0B3B60]">{value}</div>
      <div className="mt-2 text-sm text-slate-600">{label}</div>
    </div>
  );
}
