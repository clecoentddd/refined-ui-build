interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-7 pb-5 border-b-2 border-border">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2.5 items-center">{actions}</div>}
    </div>
  );
}
