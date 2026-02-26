interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4 shadow-sm">
      <div className="text-3xl font-extrabold leading-none">{value}</div>
      <div className="font-mono text-[10px] text-muted-foreground mt-1.5 tracking-widest uppercase">{label}</div>
    </div>
  );
}
