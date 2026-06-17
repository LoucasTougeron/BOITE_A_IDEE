import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Save, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import AlertMessage from '../components/ui/AlertMessage';
import { useAuth } from '../hooks/useAuth';
import { topProjectService } from '../services/topProject.service';
import { voteService } from '../services/vote.service';
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

  const { data: likedProjects = [], isLoading: loadingLiked } = useQuery<Project[]>({
    queryKey: ['my-liked-projects'],
    queryFn: () => voteService.getMyVotedProjects(),
    enabled: !!user,
    retry: 1,
  });

  const { data: existingTop = [] } = useQuery<UserTopProject[]>({
    queryKey: ['my-top-projects'],
    queryFn: () => topProjectService.getMy(),
    enabled: !!user,
  });

  const [rankings, setRankings] = useState<Record<string, number>>({});
  const [orderedSelected, setOrderedSelected] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    if (existingTop.length > 0 && !initialized) {
      const initOrder = existingTop.map((t) => t.project_id);
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
      const newOrder = orderedSelected.filter((id) => id !== projectId);
      const reRanked: Record<string, number> = {};
      newOrder.forEach((id, i) => { reRanked[id] = i + 1; });
      setRankings(reRanked);
      setOrderedSelected(newOrder);
    } else {
      if (orderedSelected.length >= 3) return;
      const newRank = orderedSelected.length + 1;
      setRankings((prev) => ({ ...prev, [projectId]: newRank }));
      setOrderedSelected((prev) => [...prev, projectId]);
    }
  }

  function onDragStart(idx: number) { setDragIdx(idx); }

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

  function onDragEnd() { setDragIdx(null); }

  const saveMutation = useMutation({
    mutationFn: (entries: { project_id: string; rank: number }[]) =>
      topProjectService.saveMy(entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-top-projects'] });
      navigate('/');
    },
  });

  function handleSave() {
    const entries = Object.entries(rankings).map(([project_id, rank]) => ({ project_id, rank }));
    saveMutation.mutate(entries);
  }

  const hasChanges = Object.keys(rankings).length > 0;

  if (loadingLiked) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-2)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
          <Trophy size={28} className="text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Mon Top 3
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          Choisis tes 3 projets préférés parmi ceux que tu as likés
        </p>
      </div>

      <section className="mb-8">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
          <Trophy size={12} /> Ton classement
          <span className="font-normal normal-case tracking-normal">(glisse pour réordonner)</span>
        </p>

        {selectedProjects.length === 0 ? (
          <div className="glass-card-static rounded-xl p-10 text-center border border-dashed border-[var(--border-medium)]">
            <p className="text-[var(--text-muted)] text-sm">Sélectionne des projets ci-dessous pour créer ton Top 3</p>
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
                  className={`glass-card-static rounded-xl p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all
                    ${isDragging ? 'border-[var(--accent-2)] opacity-60 scale-[1.02] shadow-[var(--shadow-elevated)]' : ''}`}
                  style={isDragging ? { borderColor: 'var(--accent-2)' } : undefined}
                >
                  <div className="flex flex-col gap-0.5 text-[var(--text-muted)] cursor-grab select-none">
                    <span className="text-xs leading-none">⠿</span>
                    <span className="text-xs leading-none">⠿</span>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-[var(--border-medium)] flex items-center justify-center text-xl shrink-0">
                    {rankInfo?.emoji ?? rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">{project.title}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{project.description}</p>
                  </div>

                  <button
                    onClick={() => toggleProject(project.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors shrink-0"
                  >
                    Retirer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {availableProjects.length > 0 && (
        <section className="mb-8">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Heart size={12} /> Projets likés ({availableProjects.length} disponibles)
          </p>
          <div className="flex flex-col gap-2">
            {availableProjects.slice(0, 20).map((project) => (
              <button
                key={project.id}
                onClick={() => toggleProject(project.id)}
                disabled={orderedSelected.length >= 3}
                className="glass-card text-left p-3 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-[var(--border-light)] flex items-center justify-center font-bold text-sm text-[var(--accent-2)] shrink-0">
                  {project.title.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] text-sm truncate">{project.title}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{project.theme}</p>
                </div>
                <span className="text-xs font-semibold text-[var(--accent-2)] shrink-0">
                  {orderedSelected.length < 3 ? '+ Ajouter' : 'Complet'}
                </span>
              </button>
            ))}
            {availableProjects.length > 20 && (
              <p className="text-xs text-[var(--text-muted)] text-center py-2">
                +{availableProjects.length - 20} autres projets likés
              </p>
            )}
          </div>
        </section>
      )}

      {likedProjects.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/10 flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-[var(--text-muted)]" />
          </div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">Tu n'as encore liké aucun projet</p>
          <p className="text-sm text-[var(--text-muted)] mb-6">Explore les projets et like ceux qui t'inspirent.</p>
          <Button onClick={() => navigate('/swipe')}>
            Découvrir des projets
          </Button>
        </div>
      )}

      {likedProjects.length > 0 && (
        <div className="sticky bottom-4 glass-card-static rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            <span className="font-bold text-[var(--text-primary)]">{orderedSelected.length}</span>/3 sélectionnés
          </p>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
          >
            <Save size={15} />
            {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder mon Top 3'}
          </Button>
        </div>
      )}

      {saveMutation.isError && (
        <div className="mt-4">
          <AlertMessage type="error">Erreur lors de la sauvegarde. Réessaie.</AlertMessage>
        </div>
      )}
    </div>
  );
}
