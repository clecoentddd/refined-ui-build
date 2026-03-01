interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-7 pb-4 border-b border-border">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2.5 items-center">{actions}</div>}
    </div>
  );
}
