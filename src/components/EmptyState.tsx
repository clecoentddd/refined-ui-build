// src/components/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode; // Added to support retry buttons or "Create" buttons
}

export default function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center border-2 border-dashed rounded-2xl border-muted/50 bg-muted/5">
      <div className="mb-4 text-muted-foreground/50">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground max-w-[200px] mb-4">{message}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}