import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export default function BackButton({ onClick, label = 'Retour' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group mb-4"
    >
      <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  );
}
