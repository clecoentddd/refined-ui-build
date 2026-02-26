interface EmptyStateProps {
  icon: string;
  message: string;
}

export default function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <div className="text-3xl mb-2.5">{icon}</div>
      <div className="font-mono text-xs">{message}</div>
    </div>
  );
}
