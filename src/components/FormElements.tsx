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
      <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">
        {label}{optional && <span className="text-muted-foreground/50 ml-1">(optional)</span>}
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
        'w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-sm outline-none transition-all',
        'focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
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
        'w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-sm outline-none transition-all',
        'focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
        props.className
      )}
    >
      {children}
    </select>
  );
}

/* ✅ NEW COMPONENT — OUTSIDE FormSelect */
export function FormTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      rows={2}
      className={cn(
        'w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-sm outline-none transition-all',
        'focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
        'resize-y min-h-[50px] max-h-[150px]',
        props.className
      )}
    />
  );
}