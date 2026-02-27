import { cn } from '@/lib/utils';

interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const variants = {
  default: 'bg-surface2 border-border text-muted-foreground',
  primary: 'bg-foreground/5 border-foreground/15 text-foreground',
  success: 'bg-success/10 border-success/20 text-success',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  destructive: 'bg-destructive/10 border-destructive/20 text-destructive',
};

export default function Pill({ children, variant = 'default', className }: PillProps) {
  return (
    <span className={cn(
      'inline-block font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-md border font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
