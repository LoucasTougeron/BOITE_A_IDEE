import { ChevronDown, Lightbulb, LogOut, Plus, User, LayoutDashboard } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import Button from './ui/Button';
import { useAnimateOnMount } from '../hooks/useAnimations';

const NAV_LINKS = [
  { to: '/', label: 'Explorer' },
  { to: '/rewards', label: 'Récompenses' },
  { to: '/swipe', label: 'Tinder', special: true },
  { to: '/top-projects', label: 'Mon Top 3' },
];

const USER_MENU_LINKS = (isAdmin: boolean) => [
  { to: '/profile', label: 'Mon Profil', icon: User, adminOnly: false },
  { to: '/dashboard', label: 'Dashboard Pédagogie', icon: LayoutDashboard, adminOnly: true },
].filter(link => !link.adminOnly || isAdmin);


export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  useAnimateOnMount(navRef, { type: 'fadeIn', duration: 0.4 });

  const handleSignOut = async () => {
    setSigningOut(true);
    const error = await signOut();
    setSigningOut(false);
    if (!error) {
      navigate('/login');
      setMobileOpen(false);
    }
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav 
      ref={navRef} 
      className="sticky top-0 z-50 h-14 flex items-center px-4 sm:px-6 glass-card-static border-b border-[var(--border-light)] relative" 
      style={{ borderRadius: 0 }}
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <Link 
          to="/" 
          className="flex items-center gap-2 font-bold text-lg shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Accueil BAD"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Lightbulb size={16} className="text-white" />
          </div>
          <span className="gradient-text">BAD</span>
        </Link>
        <div className="hidden lg:flex items-center gap-0.5 text-sm">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap font-medium ${
                link.special
                  ? 'gradient-text font-semibold hover:opacity-80'
                  : isActive(link.to)
                    ? 'text-[var(--text-primary)] bg-[var(--border-light)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <Button
          onClick={() => navigate('/projects/new')}
          variant="accent"
          size="sm"
          className="hidden sm:flex"
          aria-label="Déposer un nouveau projet"
        >
          <Plus size={15} /> Déposer un projet
        </Button>
        {user && (
          <div className="relative">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)]"
              aria-expanded={mobileOpen}
              aria-haspopup="menu"
              aria-label={`Menu utilisateur - ${user.email}`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-semibold text-xs shadow-md shrink-0">
                {user.email?.[0].toUpperCase()}
              </div>
              <span className="hidden lg:inline max-w-[140px] truncate text-[var(--text-primary)]">{user.email}</span>
              {isAdmin && (
                <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded font-medium shadow-sm">Admin</span>
              )}
              <ChevronDown 
                size={18} 
                className={`text-[var(--text-muted)] transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
        )}
      </div>

      {mobileOpen && (
        <>
          <div 
            className="fixed inset-0 top-14 z-40 bg-black/20 backdrop-blur-sm" 
            onClick={() => setMobileOpen(false)}
            role="presentation"
          />

          {/* Mobile et Tablette (< lg) : pleine largeur, collé sous la navbar */}
          <div 
            className="lg:hidden absolute top-full left-0 right-0 z-50 p-3 flex flex-col gap-1 border-b border-[var(--border-medium)] animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ borderRadius: '0 0 16px 16px', background: 'var(--bg-primary)' }}
            role="menu"
          >
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={`flex items-center gap-2 p-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                  link.special
                    ? 'gradient-text font-semibold hover:opacity-80'
                    : isActive(link.to)
                      ? 'text-[var(--text-primary)] bg-[var(--border-light)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)]'
                }`}
                role="menuitem"
              >
                {link.label}
              </Link>
            ))}
            <Button
              onClick={() => { navigate('/projects/new'); closeMenu(); }}
              variant="accent"
              size="md"
              className="sm:hidden flex"
              role="menuitem"
            >
              <Plus size={15} /> Déposer un projet
            </Button>
            <div className="h-px bg-[var(--border-light)] my-1" />
            {USER_MENU_LINKS(isAdmin).map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className='flex items-center gap-2 p-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] rounded-lg transition-all duration-200'
                role="menuitem"
              >
                <link.icon size={14} /> {link.label}
              </Link>
            ))}
            <button 
              onClick={handleSignOut} 
              disabled={signingOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 w-full text-left"
              role="menuitem"
            >
              <LogOut size={15} /> {signingOut ? 'Déconnexion...' : 'Se déconnecter'}
            </button>
          </div>

          {/* Desktop (≥ lg) : dropdown flottant, aligné à droite sous l'icône */}
          <div 
            className="hidden lg:flex absolute top-full right-4 sm:right-6 mt-2 z-50 w-56 flex-col gap-0.5 rounded-xl border border-[var(--border-medium)] p-1.5 shadow-elevated animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ background: 'var(--bg-primary)' }}
            role="menu"
          >
            {USER_MENU_LINKS(isAdmin).map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className="flex items-center gap-2 p-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] rounded-lg transition-all duration-200"
                role="menuitem"
              >
                <link.icon size={14} /> {link.label}
              </Link>
            ))}
            <div className="h-px bg-[var(--border-light)] my-0.5" />
            <button 
              onClick={handleSignOut} 
              disabled={signingOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 w-full text-left"
              role="menuitem"
            >
              <LogOut size={14} /> {signingOut ? 'Déconnexion...' : 'Se déconnecter'}
            </button>
          </div>
        </>
      )}
    </nav>
  );
}