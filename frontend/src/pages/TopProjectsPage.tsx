import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Save, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import type { Project, UserTopProject } from '../types';

const RANK_LABELS: Record<number, { label: string; emoji: string }> = {
  1: { label: '🥇 Top 1', emoji: '🥇' },
  2: { label: '🥈 Top 2', emoji: '🥈' },
  3: { label: '🥉 Top 3', emoji: '🥉' },
};

export default function TopProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Projets likés
  const { data: likedProjects = [], isLoading: loadingLiked } = useQuery<Project[]>({
    queryKey: ['my-liked-projects'],
    queryFn: async () => {
      try {
        const res = await api.get('/votes/my');
        const votes = res.data;
        if (!Array.isArray(votes) || votes.length === 0) return [];
        return votes.map((v: any) => v.projects).filter(Boolean);
      } catch (err) {
        console.error('Erreur récupération votes:', err);
        return [];
      }
    },
    enabled: !!user,
    retry: 1,
  });

  // Top 3 existant
  const { data: existingTop = [] } = useQuery<UserTopProject[]>({
    queryKey: ['my-top-projects'],
    queryFn: () => api.get('/user-top-projects/me').then((r) => r.data),
    enabled: !!user,
  });

  // State
  const [rankings, setRankings] = useState<Record<string, number>>({});
  const [orderedSelected, setOrderedSelected] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Initialiser depuis le top existant
  useEffect(() => {
    if (existingTop.length > 0 && !initialized) {
      const initOrder: string[] = [];
      existingTop.forEach((t) => { initOrder.push(t.project_id); });
      const initRankings: Record<string, number> = {};
      initOrder.forEach((id, i) => { initRankings[id] = i + 1; });
      setRankings(initRankings);
      setOrderedSelected(initOrder);
      setInitialized(true);
    }
  }, [existingTop, initialized]);

  const availableProjects = likedProjects.filter((p) => !rankings[p.id]);

  const selectedProjects = orderedSelected
    .map((id) => likedProjects.find((p) => p.id === id))
    .filter(Boolean) as Project[];

  function toggleProject(projectId: string) {
    if (rankings[projectId]) {
      // Retirer
      const newRankings = { ...rankings };
      delete newRankings[projectId];
      const newOrder = orderedSelected.filter((id) => id !== projectId);
      const reRanked: Record<string, number> = {};
      newOrder.forEach((id, i) => { reRanked[id] = i + 1; });
      setRankings(reRanked);
      setOrderedSelected(newOrder);
    } else {
      // Ajouter
      const newRank = orderedSelected.length + 1;
      if (newRank > 3) return;
      setRankings((prev) => ({ ...prev, [projectId]: newRank }));
      setOrderedSelected((prev) => [...prev, projectId]);
    }
  }

  // Drag & Drop handlers
  function onDragStart(idx: number) {
    setDragIdx(idx);
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;

    const newOrder = [...orderedSelected];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);

    const reRanked: Record<string, number> = {};
    newOrder.forEach((id, i) => { reRanked[id] = i + 1; });

    setOrderedSelected(newOrder);
    setRankings(reRanked);
    setDragIdx(idx);
  }

  function onDragEnd() {
    setDragIdx(null);
  }

  const saveMutation = useMutation({
    mutationFn: (newRankings: { project_id: string; rank: number }[]) =>
      api.post('/user-top-projects/me', { rankings: newRankings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-top-projects'] });
      navigate('/');
    },
  });

  function handleSave() {
    const rankingsArray = Object.entries(rankings).map(([project_id, rank]) => ({
      project_id,
      rank,
    }));
    saveMutation.mutate(rankingsArray);
  }

  const hasChanges = Object.keys(rankings).length > 0;

  if (loadingLiked) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🏆</div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Top 3</h1>
        <p className="text-gray-500 text-sm mt-1">
          Choisis tes 3 projets préférés parmi ceux que tu as likés
        </p>
      </div>

      {/* Section : Projets sélectionnés */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Trophy size={16} /> Ton classement
          <span className="text-xs text-gray-400 font-normal">(glisse pour réordonner)</span>
        </h2>

        {selectedProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">Sélectionne des projets ci-dessous pour créer ton Top 3</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedProjects.map((project, idx) => {
              const rank = rankings[project.id];
              const rankInfo = RANK_LABELS[rank];
              const isDragging = dragIdx === idx;

              return (
                <div
                  key={project.id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDragEnd={onDragEnd}
                  className={`bg-white rounded-xl border-2 p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all
                    ${isDragging ? 'border-indigo-400 shadow-lg opacity-60 scale-[1.02]' : 'border-gray-200 shadow-sm'}
                    hover:border-indigo-300`}
                >
                  {/* Drag handle */}
                  <div className="flex flex-col gap-0.5 text-gray-300 cursor-grab active:cursor-grabbing select-none">
                    <span className="text-xs leading-none">⠿</span>
                    <span className="text-xs leading-none">⠿</span>
                  </div>

                  {/* Rank badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center text-xl">
                    {rankInfo?.emoji ?? rank}
                  </div>

                  {/* Project info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{project.title}</p>
                    <p className="text-xs text-gray-400 truncate">{project.description}</p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    Retirer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section : Projets likés disponibles */}
      {availableProjects.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Heart size={16} /> Projets likés ({availableProjects.length} disponibles)
          </h2>
          <div className="grid gap-2">
            {availableProjects.slice(0, 20).map((project) => (
              <button
                key={project.id}
                onClick={() => toggleProject(project.id)}
                disabled={orderedSelected.length >= 3}
                className="text-left bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 hover:border-indigo-300 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                  {project.title.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{project.title}</p>
                  <p className="text-xs text-gray-400 truncate">{project.theme}</p>
                </div>
                <span className="text-xs text-indigo-600 flex-shrink-0">
                  {orderedSelected.length < 3 ? '+ Ajouter' : 'Complet'}
                </span>
              </button>
            ))}
            {availableProjects.length > 20 && (
              <p className="text-xs text-gray-400 text-center py-2">
                +{availableProjects.length - 20} autres projets likés
              </p>
            )}
          </div>
        </section>
      )}

      {/* Projets likés vides */}
      {likedProjects.length === 0 && (
        <div className="text-center py-12">
          <Heart size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">Tu n'as encore liké aucun projet</p>
          <button
            onClick={() => navigate('/swipe')}
            className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Découvrir des projets
          </button>
        </div>
      )}

      {/* Barre d'action */}
      {likedProjects.length > 0 && (
        <div className="sticky bottom-4 bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 p-4 shadow-lg flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {orderedSelected.length}/3 sélectionnés
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            <Save size={16} />
            {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder mon Top 3'}
          </button>
        </div>
      )}

      {saveMutation.isError && (
        <p className="text-center text-red-500 text-sm mt-2">
          Erreur lors de la sauvegarde. Réessaie.
        </p>
      )}
    </div>
  );
}