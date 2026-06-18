import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Shuffle, Trophy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
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
    if (!leaving) return;
    const t = setTimeout(() => {
      setLeaving(null);
      setDragX(0);
      setIndex((i) => i + 1);
    }, 280);
    return () => clearTimeout(t);
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
    } catch { /* already voted */ }
  }

  async function triggerPass() {
    if (!user) { navigate('/login'); return; }
    setLeaving('left');
    try {
      await voteService.dislike(current.id);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch { /* already disliked */ }
  }

  const rotation = dragX / 18;
  const likeOpacity = Math.min(1, Math.max(0, dragX / SWIPE_THRESHOLD));
  const passOpacity = Math.min(1, Math.max(0, -dragX / SWIPE_THRESHOLD));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="w-full max-w-sm mx-4 h-[460px] glass-card-static rounded-2xl shimmer" />
      </div>
    );
  }

  if (!current || index >= projects.length) {
    return (
      <div className="flex flex-col h-[calc(100vh-56px)] items-center justify-center px-4 page-enter">
        <EmptyState
          emoji="🎉"
          title="Tu as tout vu !"
          description="Plus aucun projet à découvrir pour l'instant."
          action={
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setIndex(0)}>
                <Shuffle size={15} /> Recommencer
              </Button>
              {user && (
                <Button onClick={() => navigate('/top-projects')}>
                  <Trophy size={15} /> Mon Top 3
                </Button>
              )}
            </div>
          }
        />
      </div>
    );
  }

  const cardStyle = leaving
    ? {
        transform: `translateX(${leaving === 'right' ? 480 : -480}px) rotate(${leaving === 'right' ? 18 : -18}deg)`,
        opacity: 0,
        transition: 'transform 0.28s ease, opacity 0.28s ease',
      }
    : {
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        transition: dragging ? 'none' : 'transform 0.25s ease',
        cursor: dragging ? 'grabbing' : 'grab',
      };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] page-enter select-none overflow-hidden">

      {/* Header compact */}
      <div className="px-4 sm:px-8 pt-5 pb-2 shrink-0 flex justify-center">
        <div className="w-full max-w-sm">
          <PageHeader
            icon={<Shuffle size={22} className="text-[var(--accent-2)]" />}
            title="Découvrir"
            description={`Projet ${index + 1} sur ${projects.length} — swipe pour explorer`}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 pb-6 min-h-0">

        {/* Hint */}
        <p className="text-sm text-[var(--text-muted)] text-center">
          Glisse à <span className="text-emerald-500 font-semibold">droite</span> pour liker, à <span className="text-red-400 font-semibold">gauche</span> pour passer
        </p>

        {/* Card stack */}
        <div className="relative w-full max-w-sm" style={{ height: 'min(460px, calc(100vh - 340px))' }}>
          {next && (
            <div className="absolute inset-0 glass-card-static rounded-2xl scale-[0.96] translate-y-3 opacity-50" />
          )}

          {/* Wrapper qui suit le mouvement de la carte */}
          <div
            ref={cardRef}
            style={cardStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute inset-0"
          >
            {/* Carte avec flou */}
            <div
              className="absolute inset-0 glass-card-static rounded-2xl shadow-[var(--shadow-elevated)] flex flex-col p-6 overflow-hidden"
              style={{ filter: Math.max(likeOpacity, passOpacity) > 0 ? `blur(${Math.max(likeOpacity, passOpacity) * 4}px)` : undefined }}
            >
              {/* Badges */}
              <div className="flex items-center justify-between mb-4">
                <span className={`theme-badge theme-badge-${current.theme.toLowerCase()}`}>{current.theme}</span>
                <span className={`badge badge-${current.status}`}>{STATUS_LABEL[current.status] ?? current.status}</span>
              </div>

              {/* Titre + description */}
              <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-snug mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                {current.title}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {current.description}
              </p>

              {/* Tags */}
              {current.tags && current.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {current.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="tag-pill text-xs px-2.5 py-1">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-[var(--border-light)] flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
                  <Heart size={14} /> <span className="font-medium">{current.votes?.[0]?.count ?? 0}</span> likes
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/projects/${current.id}`); }}
                  className="text-sm font-semibold gradient-text hover:opacity-70 transition-opacity"
                >
                  Voir le projet →
                </button>
              </div>
            </div>

            {/* Stamps — dans le wrapper, pas dans la carte floue */}
            <div
              style={{ opacity: likeOpacity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl overflow-hidden"
            >
              <span className="font-black text-[clamp(4rem,18vw,7rem)] border-4 border-emerald-500 px-4 rounded-2xl leading-none -rotate-[20deg] select-none" style={{ WebkitTextStroke: '3px rgb(16,185,129)', color: 'transparent', textShadow: '0 0 60px rgba(16,185,129,0.35)' }}>
                LIKE
              </span>
            </div>
            <div
              style={{ opacity: passOpacity }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl overflow-hidden"
            >
              <span className="font-black text-[clamp(4rem,18vw,7rem)] border-4 border-red-500 px-4 rounded-2xl leading-none rotate-[20deg] select-none" style={{ WebkitTextStroke: '3px rgb(248,113,113)', color: 'transparent', textShadow: '0 0 60px rgba(248,113,113,0.35)' }}>
                PASS
              </span>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="flex items-center gap-5">
            <button
              onClick={triggerPass}
              className="w-20 h-20 rounded-2xl glass-card-static border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 flex items-center justify-center transition-all active:scale-90"
            >
              <X size={26} strokeWidth={2.5} />
            </button>

            <button
              onClick={triggerLike}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all active:scale-90"
            >
              <Heart size={32} strokeWidth={2} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
