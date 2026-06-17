interface AlertMessageProps {
  type: 'error' | 'success' | 'info';
  children: React.ReactNode;
}

const STYLES: Record<AlertMessageProps['type'], string> = {
  error: 'bg-red-50/80 border-red-200/50 text-red-600',
  success: 'bg-emerald-50/80 border-emerald-200/50 text-emerald-700',
  info: 'bg-[var(--bg-elevated)] border-[var(--border-light)] text-[var(--text-secondary)]',
};

export default function AlertMessage({ type, children }: AlertMessageProps) {
  return (
    <div
      className={`px-4 py-3 rounded-xl text-sm border backdrop-blur-sm ${STYLES[type]}`}
    >
      {children}
    </div>
  );
}
