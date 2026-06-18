import type { ReactNode } from 'react';

interface SectionTitleProps {
  children: ReactNode;
  icon?: ReactNode;
  note?: string;
  count?: number;
  className?: string;
}

export default function SectionTitle({ children, icon, note, count, className = '' }: SectionTitleProps) {
  return (
    <p className={`text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 ${className}`}>
      {icon}
      {children}
      {count !== undefined && (
        <span className="font-normal normal-case tracking-normal text-[var(--text-muted)]">({count})</span>
      )}
      {note && (
        <span className="font-normal normal-case tracking-normal text-[var(--text-muted)]">{note}</span>
      )}
    </p>
  );
}
