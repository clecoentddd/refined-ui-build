interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/20 transition-all">
      <div className="text-2xl font-bold leading-none tracking-tight text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">{label}</div>
    </div>
  );
}
