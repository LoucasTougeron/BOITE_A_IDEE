import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  dashed?: boolean;
}

export default function EmptyState({ icon, emoji, title, description, action, dashed = false }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center rounded-2xl ${
        dashed ? 'border-2 border-dashed border-[var(--border-medium)] px-6' : ''
      }`}
    >
      {(icon || emoji) && (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/10 flex items-center justify-center mb-4">
          {emoji ? <span className="text-3xl">{emoji}</span> : icon}
        </div>
      )}
      <p className="font-semibold text-[var(--text-primary)] mb-1">{title}</p>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
