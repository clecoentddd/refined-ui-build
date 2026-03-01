import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
}

export default function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <div className="mb-3 flex justify-center">
        {icon || <Inbox className="w-8 h-8 opacity-30" />}
      </div>
      <div className="text-sm">{message}</div>
    </div>
  );
}
