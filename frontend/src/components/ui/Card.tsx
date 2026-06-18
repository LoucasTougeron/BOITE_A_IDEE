import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  overflow?: boolean;
}

export default function Card({
  title,
  icon,
  action,
  children,
  className = '',
  overflow = true,
}: CardProps) {
  const hasHeader = title || action;

  return (
    <div className={`glass-card-static rounded-xl ${overflow ? '' : 'overflow-hidden'} ${className}`}>
      {hasHeader && (
      <div className={`flex items-center justify-between gap-3 border-b border-[var(--border-light)] py-4 px-6`}>          {title && (
            <div className="flex items-center gap-2 min-w-0">
              {icon && <span className="shrink-0 text-[var(--accent-2)]">{icon}</span>}
              <h2 className="text-base font-semibold uppercase">{title}</h2>
            </div>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className='p-6'>{children}</div>
    </div>
  );
}
