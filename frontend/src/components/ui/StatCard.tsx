import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}

export default function StatCard({ icon, label, value, accent = false }: StatCardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        accent
          ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/15'
          : 'bg-[var(--bg-elevated)] border border-[var(--border-light)]'
      }`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-muted)] truncate">{label}</p>
        <p className="font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
}
