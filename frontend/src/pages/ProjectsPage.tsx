import { useQuery } from '@tanstack/react-query';
import { Filter, LayoutGrid, List, Search, Shuffle, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import { useAnimateOnMount, useStaggerAnimation } from '../hooks/useAnimations';
import { projectService } from '../services/project.service';
import type { Project } from '../types';

const THEMES = ['Tech', 'Design', 'Business', 'Social', 'Science', 'Art'];
const STATUSES = [
  { value: 'idea', label: 'Idée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useAnimateOnMount(sidebarRef, { type: 'slideRight', duration: 0.5 });
  useStaggerAnimation(gridRef, '> div', { type: 'fadeUp', stagger: 0.06, delay: 0.2, duration: 0.45 });

  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = {
    ...(search && { search }),
    ...(theme && { theme }),
    ...(status && { status }),
  };

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', filters],
    queryFn: () => projectService.getAll(filters),
  });

  async function handleRandom() {
    try {
      const project = await projectService.getRandom();
      navigate(`/projects/${project.id}`);
    } catch {
      // no projects available
    }
  }

  const hasFilters = search || theme || status;
  const clearFilters = () => { setSearch(''); setTheme(''); setStatus(''); };

  return (
    <div className="flex h-[calc(100vh-56px)] page-enter relative">
      {filtersOpen && (
        <div className="fixed inset-0 top-14 z-30 bg-black/30 lg:hidden" onClick={() => setFiltersOpen(false)} />
      )}
      <aside
        ref={sidebarRef}
        className={`fixed lg:static top-14 lg:top-auto bottom-0 lg:bottom-auto left-0 z-40 w-72 lg:w-64 shrink-0 border-r border-[var(--border-light)] bg-[var(--bg-glass-heavy)] lg:bg-[var(--bg-glass)] backdrop-blur-xl flex flex-col py-6 px-4 overflow-y-auto shadow-2xl lg:shadow-none transition-transform duration-300 ${filtersOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
            <Filter size={12} /> Filtres
          </div>
          <button onClick={() => setFiltersOpen(false)} className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-modern pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={13} />
            </button>
          )}
        </div>

        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Thématique</p>
        <div className="flex flex-col gap-0.5 mb-6">
          <button
            onClick={() => setTheme('')}
            className={`text-left text-sm px-3 py-1.5 rounded-lg transition-all ${!theme ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-[var(--accent-2)] font-semibold border border-purple-500/20' : 'text-[var(--text-secondary)] hover:bg-[var(--border-light)]'}`}
          >
            Toutes
          </button>
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(theme === t ? '' : t)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-all ${theme === t ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-[var(--accent-2)] font-semibold border border-purple-500/20' : 'text-[var(--text-secondary)] hover:bg-[var(--border-light)]'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Statut</p>
        <div className="flex flex-col gap-0.5 mb-6">
          <button
            onClick={() => setStatus('')}
            className={`text-left text-sm px-3 py-1.5 rounded-lg transition-all ${!status ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-[var(--accent-2)] font-semibold border border-purple-500/20' : 'text-[var(--text-secondary)] hover:bg-[var(--border-light)]'}`}
          >
            Tous
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(status === s.value ? '' : s.value)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-all ${status === s.value ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-[var(--accent-2)] font-semibold border border-purple-500/20' : 'text-[var(--text-secondary)] hover:bg-[var(--border-light)]'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="mt-auto flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1 transition-colors">
            <X size={12} /> Effacer les filtres
          </button>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto w-full">
        <div className="px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--border-light)] transition-colors"
                aria-label="Ouvrir les filtres"
              >
                <Filter size={15} />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-[var(--text-primary)] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                  {theme || 'Tous les projets'}
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {isLoading ? '...' : `${projects.length} projet${projects.length > 1 ? 's' : ''}`}
                  {hasFilters && ' · filtré'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRandom} className="btn-ghost flex items-center gap-1.5 text-sm">
                <Shuffle size={14} /> Aléatoire
              </button>
              <div className="flex border border-[var(--border-light)] rounded-xl overflow-hidden bg-[var(--bg-glass)]">
                <button onClick={() => setView('grid')} className={`px-2.5 py-2 transition-colors ${view === 'grid' ? 'text-[var(--accent-2)] bg-[var(--border-light)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                  <LayoutGrid size={15} />
                </button>
                <button onClick={() => setView('list')} className={`px-2.5 py-2 transition-colors ${view === 'list' ? 'text-[var(--accent-2)] bg-[var(--border-light)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card h-44 shimmer" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-4 border border-purple-500/10">
                <Search size={24} className="text-[var(--text-muted)]" />
              </div>
              <p className="font-semibold text-[var(--text-primary)] mb-1">Aucun projet trouvé</p>
              <p className="text-sm text-[var(--text-muted)]">Essayez d'autres filtres ou déposez le premier !</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-4 text-sm font-semibold gradient-text hover:opacity-80 transition-opacity">
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : view === 'grid' ? (
            <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          ) : (
            <div ref={gridRef} className="flex flex-col gap-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="glass-card px-5 py-4 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-[var(--text-primary)] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all truncate">{p.title}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] truncate">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`theme-badge theme-badge-${p.theme.toLowerCase()}`}>{p.theme}</span>
                    <span className="text-xs text-[var(--text-muted)]">{p.votes?.[0]?.count ?? 0} ♥</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
