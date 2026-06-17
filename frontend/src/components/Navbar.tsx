import { ChevronDown, Lightbulb, LogOut, Plus, User, LayoutDashboard } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import { useAnimateOnMount } from '../hooks/useAnimations';
import DashboardPage from '../pages/DashboardPage';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useAnimateOnMount(navRef, { type: 'fadeIn', duration: 0.4 });

  async function handleSignOut() {
    await signOut();
    navigate('/login');
    setMobileOpen(false);
  }

  return (
    <nav ref={navRef} className="sticky top-0 z-50 h-14 flex items-center px-4 sm:px-6 glass-card-static rounded-none border-x-0 border-t-0 relative" style={{ borderRadius: 0 }}>
      <div className="flex items-center gap-4 sm:gap-8 flex-1 min-w-0">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Lightbulb size={16} className="text-white" />
          </div>
          <span className="gradient-text">BAD</span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-sm text-[var(--text-secondary)]">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg hover:bg-[var(--border-light)] hover:text-[var(--text-primary)] transition-colors"
          >
            Explorer
          </Link>
          <Link
            to="/swipe"
            className="px-3 py-1.5 rounded-lg hover:bg-[var(--border-light)] hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 font-medium transition-all flex items-center gap-1.5"
          >
            🔥 Tinder Mode
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <ThemeToggle />
        {user && (
          <button
            onClick={() => navigate('/projects/new')}
            className="hidden sm:flex btn-accent items-center gap-1.5 text-sm py-2"
          >
            <Plus size={15} /> Déposer un projet
          </button>
        )}

        {user ? (
          <div className="relative">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--border-light)] transition-colors text-sm text-[var(--text-secondary)]"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-semibold text-xs shadow-md shrink-0">
                {user.email?.[0].toUpperCase()}
              </div>
              <span className="hidden lg:inline max-w-[140px] truncate">{user.email}</span>
              {isAdmin && (
                <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded font-medium shadow-sm">Admin</span>
              )}
              <ChevronDown size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            <User size={15} /> Connexion
          </Link>
        )}
      </div>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 top-14 z-40" onClick={() => setMobileOpen(false)} />

          {/* Mobile (< md) : pleine largeur, collé sous la navbar */}
          <div className="md:hidden absolute top-full left-0 right-0 z-50 p-3 flex flex-col gap-1 border-b border-[var(--border-medium)]"
            style={{ borderRadius: '0 0 16px 16px', background: 'var(--bg-primary)' }}>
            <Link to="/" onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--border-light)] hover:text-[var(--text-primary)] transition-colors">
              Explorer
            </Link>
            <Link to="/swipe" onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--border-light)] transition-colors flex items-center gap-1.5">
              🔥 Tinder Mode
            </Link>
            {user && (
              <>
                <button
                  onClick={() => { navigate('/projects/new'); setMobileOpen(false); }}
                  className="btn-accent flex items-center justify-center gap-1.5 text-sm py-2.5 mt-1">
                  <Plus size={15} /> Déposer un projet
                </button>
                <div className="h-px bg-[var(--border-light)] my-1" />
                <Link to="/profile" onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--border-light)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2">
                  <User size={15} /> Mon Profil
                </Link>
                {isAdmin && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] rounded-lg transition-colors"
                  >
                    <LogOut size={14} className="opacity-0 w-0" /> Dashboard Pédagogie
                  </Link>
                )}
                <button onClick={handleSignOut}
                  className="px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50/80 transition-colors flex items-center gap-2 text-left">
                  <LogOut size={15} /> Se déconnecter
                </button>
              </>
            )}
          </div>

          {/* Desktop (≥ md) : dropdown flottant, aligné à droite sous l'icône */}
          <div className="hidden md:flex absolute top-full right-4 sm:right-6 mt-2 z-50 w-55 flex-col gap-0.5 rounded-xl border border-[var(--border-medium)] p-1.5 shadow-elevated"
            style={{ background: 'var(--bg-primary)' }}>
            <Link to="/profile" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] rounded-lg transition-colors">
              <User size={14} /> Mon Profil
            </Link>
            {isAdmin && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] rounded-lg transition-colors"
                  >
                    <LayoutDashboard size={14} /> Dashboard Pédagogie
                  </Link>
                )}
            <div className="h-px bg-[var(--border-light)] my-0.5" />
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50/50 rounded-lg transition-colors w-full text-left">
              <LogOut size={14} /> Se déconnecter
            </button>
          </div>
        </>
      )}
    </nav>
  );
}