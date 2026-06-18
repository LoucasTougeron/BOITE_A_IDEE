import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
}

export default function PageHeader({ icon, title, description, action, centered = false }: PageHeaderProps) {
  if (centered) {
    return (
      <div className="flex flex-col items-center text-center gap-3 mb-8">
        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
          {description && <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </h1>
            {description && (
              <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
            )}
          </div>
        </div>

        {action && <div className="hidden sm:block shrink-0">{action}</div>}
      </div>

      {action && <div className="sm:hidden mt-3">{action}</div>}
    </div>
  );
}
