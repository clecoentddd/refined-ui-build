import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  optional?: boolean;
}

export function FormField({ label, children, className, optional }: FormFieldProps) {
  return (
    <div className={cn('mb-4', className)}>
      <label className="block font-mono text-[10px] text-muted-foreground tracking-[1.5px] uppercase mb-1.5">
        {label}{optional && <span className="text-muted-foreground/60 ml-1">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-foreground font-mono text-xs outline-none transition-all',
        'focus:border-primary focus:ring-2 focus:ring-primary/10',
        props.className
      )}
    />
  );
}

export function FormSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full bg-card border border-border-strong rounded-lg px-3.5 py-2.5 text-foreground font-mono text-xs outline-none transition-all',
        'focus:border-primary focus:ring-2 focus:ring-primary/10',
        props.className
      )}
    >
      {children}
    </select>
  );
}
