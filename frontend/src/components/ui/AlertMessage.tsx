import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';

interface AlertMessageProps {
  type: 'error' | 'success' | 'info';
  children: ReactNode;
}

const CONFIG: Record<AlertMessageProps['type'], { className: string; Icon: typeof AlertCircle }> = {
  error:   { className: 'bg-red-500/10 border-red-500/20 text-red-500',                                              Icon: AlertCircle  },
  success: { className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',                                  Icon: CheckCircle2 },
  info:    { className: 'bg-[var(--bg-elevated)] border-[var(--border-light)] text-[var(--text-secondary)]',         Icon: Info         },
};

export default function AlertMessage({ type, children }: AlertMessageProps) {
  const { className, Icon } = CONFIG[type];
  return (
    <div className={`px-4 py-3 rounded-xl text-sm border backdrop-blur-sm flex items-start gap-2.5 ${className}`}>
      <Icon size={15} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
