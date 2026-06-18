import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Shuffle, Trophy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { projectService } from '../services/project.service';
import { voteService } from '../services/vote.service';
import type { Project } from '../types';

const STATUS_LABEL: Record<string, string> = {
  idea: 'Idée',
  in_progress: 'En cours',
  completed: 'Terminé',
};

const SWIPE_THRESHOLD = 100;

export default function SwipePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects-swipe'],
    queryFn: () => projectService.getAll(),
  });

  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const current = projects[index];
  const next = projects[index + 1];

  useEffect(() => {
    if (leaving) {
      const t = setTimeout(() => {
        setLeaving(null);
        setDragX(0);
        setIndex((i) => i + 1);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [leaving]);

  function onPointerDown(e: React.PointerEvent) {
    if (leaving) return;
    setDragging(true);
    startX.current = e.clientX;
    cardRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (dragX > SWIPE_THRESHOLD) triggerLike();
    else if (dragX < -SWIPE_THRESHOLD) triggerPass();
    else setDragX(0);
  }

  async function triggerLike() {
    if (!user) { navigate('/login'); return; }
    setLeaving('right');
    try {
      await voteService.vote(current.id);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch {
      // vote already exists
    }
  }

  async function triggerPass() {
    if (!user) { navigate('/login'); return; }
    setLeaving('left');
    try {
      await voteService.dislike(current.id);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch {
      // dislike already exists
    }
  }

  const rotation = dragX / 15;
  const likeOpacity = Math.min(1, Math.max(0, dragX / SWIPE_THRESHOLD));
  const passOpacity = Math.min(1, Math.max(0, -dragX / SWIPE_THRESHOLD));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="w-80 h-[480px] glass-card-static rounded-2xl shimmer" />
      </div>
    );
  }

  if (!current || index >= projects.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] gap-4">
        <div className="w-20 h-20 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-full flex items-center justify-center text-4xl">🎉</div>
        <p className="text-xl font-bold text-[var(--text-primary)]">Tu as tout vu !</p>
        <p className="text-[var(--text-secondary)] text-sm">Plus aucun projet à découvrir pour l'instant.</p>
        <div className="flex gap-3 mt-2">
          <Button variant="ghost" onClick={() => setIndex(0)}>
            Recommencer
          </Button>
          {user && (
            <Button onClick={() => navigate('/top-projects')}>
              <Trophy size={15} /> Mon Top 3
            </Button>
          )}
        </div>
      </div>
    );
  }

  const cardStyle = leaving
    ? {
        transform: `translateX(${leaving === 'right' ? 500 : -500}px) rotate(${leaving === 'right' ? 20 : -20}deg)`,
        opacity: 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      }
    : {
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        transition: dragging ? 'none' : 'transform 0.3s ease',
        cursor: dragging ? 'grabbing' : 'grab',
      };

  return (
    <div className="flex flex-col items-center h-[calc(100vh-56px)] select-none page-enter overflow-y-auto">
      <div className="w-full max-w-sm px-4 pt-6">
        <PageHeader
          icon={<Shuffle size={24} className="text-[var(--accent-2)]" />}
          title="Découvrir"
          description="Swipe les projets, like ceux qui t'inspirent."
        />
      </div>
      <div className="flex flex-col items-center justify-center flex-1 gap-8 w-full">
      <div className="relative w-80 h-[480px]">
        {next && (
          <div className="absolute inset-0 glass-card-static rounded-2xl shadow-md scale-95 translate-y-4" />
        )}

        <div
          ref={cardRef}
          style={cardStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute inset-0 glass-card-static rounded-2xl shadow-xl flex flex-col p-6 overflow-hidden"
        >
          <div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-6 border-4 border-emerald-500 text-emerald-500 font-black text-2xl px-3 py-1 rounded-xl rotate-[-20deg] pointer-events-none"
          >
            LIKE
          </div>

          <div
            style={{ opacity: passOpacity }}
            className="absolute top-8 right-6 border-4 border-red-400 text-red-400 font-black text-2xl px-3 py-1 rounded-xl rotate-[20deg] pointer-events-none"
          >
            PASS
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className={`theme-badge theme-badge-${current.theme.toLowerCase()}`}>
              {current.theme}
            </span>
            <span className={`badge badge-${current.status}`}>
              {STATUS_LABEL[current.status] ?? current.status}
            </span>
          </div>

          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
            {current.title}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1 line-clamp-5">
            {current.description}
          </p>

          {current.objective && (
            <div className="mt-4 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-xl p-3">
              <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">Objectif</p>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-3">{current.objective}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1 mt-4">
            {current.tags?.slice(0, 4).map((tag) => (
              <span key={tag} className="tag-pill">#{tag}</span>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-light)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Heart size={12} /> {current.votes?.[0]?.count ?? 0} likes
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/projects/${current.id}`); }}
              className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-80 transition-opacity"
            >
              Voir le projet →
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 mt-4">
        <button
          onClick={triggerPass}
          className="w-20 h-20 rounded-full glass-card border-2 border-red-500/20 text-red-500 hover:bg-red-500/10 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
        >
          <X size={36} strokeWidth={3} />
        </button>
        <button
          onClick={triggerLike}
          className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white hover:scale-105 flex items-center justify-center shadow-xl shadow-pink-500/25 transition-all"
        >
          <Heart size={44} strokeWidth={2.5} fill="currentColor" />
        </button>
      </div>

      <p className="text-xs text-[var(--text-muted)]">Glisse ou utilise les boutons</p>
      </div>
    </div>
  );
}
