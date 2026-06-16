import { Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function SwipeTab() {
  const { pathname } = useLocation();
  if (pathname === '/swipe') return null;

  return (
    <Link
      to="/swipe"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-4 rounded-l-xl shadow-lg transition-colors"
      style={{ writingMode: 'vertical-rl' }}
    >
      <Sparkles size={16} className="rotate-90" />
      <span className="text-xs font-semibold tracking-wide">Tinder</span>
    </Link>
  );
}
