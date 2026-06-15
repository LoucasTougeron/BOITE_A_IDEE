import { useQuery } from '@tanstack/react-query';
import { Filter, LayoutGrid, List, Search, Shuffle, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import api from '../lib/api';
import type { Project } from '../types';

const THEMES = ['Tech', 'Design', 'Business', 'Social', 'Science', 'Art'];
const STATUSES = [
  { value: 'idea', label: 'Idée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (theme) params.theme = theme;
  if (status) params.status = status;

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', params],
    queryFn: () => api.get('/projects', { params }).then((r) => r.data),
  });

  async function handleRandom() {
    try {
      const { data } = await api.get('/projects/random');
      navigate(`/projects/${data.id}`);
    } catch {
      // no projects
    }
  }

  const hasFilters = search || theme || status;
  const clearFilters = () => { setSearch(''); setTheme(''); setStatus(''); };

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col py-6 px-4 overflow-y-auto">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">
          <Filter size={12} /> Filtres
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Themes */}
        <p className="text-xs font-semibold text-gray-500 mb-2 px-1">Thématique</p>
        <div className="flex flex-col gap-0.5 mb-6">
          <button
            onClick={() => setTheme('')}
            className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!theme ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Toutes
          </button>
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(theme === t ? '' : t)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${theme === t ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Status */}
        <p className="text-xs font-semibold text-gray-500 mb-2 px-1">Statut</p>
        <div className="flex flex-col gap-0.5 mb-6">
          <button
            onClick={() => setStatus('')}
            className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!status ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Tous
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(status === s.value ? '' : s.value)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${status === s.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="mt-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-1 transition-colors">
            <X size={12} /> Effacer les filtres
          </button>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {theme || 'Tous les projets'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isLoading ? '...' : `${projects.length} projet${projects.length > 1 ? 's' : ''}`}
                {hasFilters && ' · filtré'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRandom}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 bg-white px-3.5 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Shuffle size={14} /> Aléatoire
              </button>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button onClick={() => setView('grid')} className={`px-2.5 py-2 transition-colors ${view === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  <LayoutGrid size={15} />
                </button>
                <button onClick={() => setView('list')} className={`px-2.5 py-2 transition-colors ${view === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Cards */}
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-44 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">Aucun projet trouvé</p>
              <p className="text-sm text-gray-400">Essayez d'autres filtres ou déposez le premier !</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-4 text-sm text-indigo-600 hover:underline">
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-900 group-hover:text-indigo-700 truncate transition-colors">{p.title}</span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{p.theme}</span>
                    <span className="text-xs text-gray-400">{p.votes?.[0]?.count ?? 0} ♥</span>
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
