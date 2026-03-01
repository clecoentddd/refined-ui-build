import { cn } from '@/lib/utils';

interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const variants = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export default function Pill({ children, variant = 'default', className }: PillProps) {
  return (
    <span className={cn(
      'inline-block text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
