import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, subtitle, children }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border rounded-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">{title}</DialogTitle>
          {subtitle && <DialogDescription className="font-mono text-[11px] text-muted-foreground">{subtitle}</DialogDescription>}
        </DialogHeader>
        <div className="mt-2">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
