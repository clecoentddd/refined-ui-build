interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-8 pb-5 border-b border-border">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="font-mono text-[11px] text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2.5 items-center">{actions}</div>}
    </div>
  );
}
