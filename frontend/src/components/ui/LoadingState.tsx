interface LoadingStateProps {
  text?: string;
  fullPage?: boolean;
}

export default function LoadingState({ text = 'Chargement...', fullPage = false }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${fullPage ? 'h-[calc(100vh-56px)]' : 'py-16'}`}>
      <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-2)] border-t-transparent animate-spin" />
      <p className="text-sm text-[var(--text-muted)]">{text}</p>
    </div>
  );
}
