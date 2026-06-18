import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
}

export default function PageHeader({ icon, title, description, action, centered = false }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-8 ${centered ? 'flex-col items-center text-center' : ''}`}>
      <div className={`flex items-center gap-4 ${centered ? 'flex-col' : ''}`}>
        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className={centered ? 'text-center' : ''}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
