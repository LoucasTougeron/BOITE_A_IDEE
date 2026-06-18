import type { ReactNode } from 'react';

interface ProgressBarProps {
  value: number;
  label?: ReactNode;
  sublabel?: string;
  size?: 'sm' | 'md';
}

export default function ProgressBar({ value, label, sublabel, size = 'md' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const trackH = size === 'sm' ? 'h-1.5' : 'h-3';

  return (
    <div className="space-y-1.5">
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-[var(--text-secondary)]">{label}</span>}
          {sublabel && <span className="text-[var(--text-muted)]">{sublabel}</span>}
        </div>
      )}
      <div className={`${trackH} rounded-full bg-white/10 overflow-hidden`}>
        <div
          className={`${trackH} rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
