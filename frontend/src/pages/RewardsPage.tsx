import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trophy, Gift, Stars, Heart, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ui/ProgressBar';
import StatCard from '../components/ui/StatCard';
import { rewardService } from '../services/reward.service';
import type { RewardData, Trophy as TrophyType } from '../types';

const RARITY_COLORS: Record<string, { bg: string; text: string; badge: string; border: string }> = {
  commun:     { bg: 'bg-[var(--bg-elevated)]', text: 'text-[var(--text-secondary)]', badge: 'bg-[var(--bg-surface)] text-[var(--text-secondary)]', border: 'border-[var(--border-medium)]'  },
  rare:       { bg: 'bg-blue-500/10',           text: 'text-blue-400',                badge: 'bg-blue-500/20 text-blue-400',                          border: 'border-blue-500/30'            },
  epique:     { bg: 'bg-purple-500/10',         text: 'text-purple-400',              badge: 'bg-purple-500/20 text-purple-400',                      border: 'border-purple-500/30'          },
  legendaire: { bg: 'bg-yellow-500/10',         text: 'text-yellow-500',              badge: 'bg-yellow-500/20 text-yellow-600',                      border: 'border-yellow-500/40'          },
};

const LEVELS = [
  { name: 'Nouvel arrivant', icon: '🌱', range: '0 - 49 points' },
  { name: 'Explorateur',     icon: '🧭', range: '50 - 149 points' },
  { name: 'Innovateur',      icon: '💡', range: '150 - 299 points' },
  { name: 'Actionnaire',     icon: '📈', range: '300 - 599 points' },
  { name: 'Directeur',       icon: '🎩', range: '600 - 999 points' },
  { name: 'Visionnaire',     icon: '✨', range: '1000+ points' },
];

const FILTER_STYLES: Record<string, string> = {
  all:    'bg-purple-500/20 text-purple-500',
  earned: 'bg-emerald-500/20 text-emerald-500',
  locked: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
};

export default function RewardsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  const { data, isLoading } = useQuery<RewardData>({
    queryKey: ['rewards'],
    queryFn: () => rewardService.getMy(),
    enabled: !!user,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!data?.notifications) return;
    data.notifications.newTrophies?.forEach((trophy) => {
      notify({ type: 'trophy', title: `🏆 ${trophy.title}`, description: trophy.description });
    });
    if (data.notifications.levelChanged) {
      notify({
        type: 'level',
        title: `⭐ Nouveau niveau: ${data.notifications.levelChanged.level}`,
        description: 'Vous avez atteint un nouveau palier!',
      });
    }
  }, [data?.notifications, notify]);

  const participateMutation = useMutation({
    mutationFn: () => rewardService.participate(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      if (res.participation.status === 'won') {
        notify({ type: 'success', title: '🎉 Gagné!', description: res.participation.prize });
      } else {
        notify({ type: 'info', title: 'Participation enregistrée', description: res.participation.prize });
      }
    },
    onError: () => {
      notify({ type: 'error', title: 'Erreur', description: 'Impossible de participer pour le moment.' });
    },
  });

  if (isLoading || !data) {
    return <LoadingState fullPage text="Chargement des récompenses..." />;
  }

  const earnedIds = new Set(data.earned.map((t) => t.id));
  const earnedTrophies = data.progress.filter((t) => earnedIds.has(t.id));
  const lockedTrophies = data.progress.filter((t) => !earnedIds.has(t.id));

  const filteredTrophies =
    filter === 'earned' ? earnedTrophies :
    filter === 'locked' ? lockedTrophies :
    data.progress;

  return (
    <div className="min-h-[calc(100vh-56px)] page-enter">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          icon={<Trophy size={24} className="text-yellow-500" />}
          title="Récompenses et trophées"
          description="Suivez votre progression, débloquez des trophées et participez aux tirages."
          action={
            <Button onClick={() => participateMutation.mutate()} disabled={participateMutation.isPending}>
              <Gift size={16} /> Participer au tirage
            </Button>
          }
        />

        {/* Niveau + Résumé */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card title="Niveau et Progression" className="lg:col-span-2">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Votre niveau</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{data.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Points</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{data.points}</p>
                </div>
              </div>
              <ProgressBar
                value={data.progressToNextLevel}
                label={<>Progression vers <strong>{data.nextLevel}</strong></>}
                sublabel={`${data.pointsForNextLevel} pts restants`}
              />
            </div>
          </Card>

          <Card title="Résumé">
            <div className="space-y-3">
              <StatCard icon={<Zap size={16} className="text-yellow-500" />} label="Idées postées" value={data.stats.ideaCount} />
              <StatCard icon={<Heart size={16} className="text-red-500" />} label="Likes reçus" value={data.stats.totalLikes} />
              <StatCard icon={<TrendingUp size={16} className="text-emerald-500" />} label="Votes donnés" value={data.stats.votesGivenCount} />
            </div>
          </Card>
        </div>

        {/* Post le plus liké */}
        {data.stats.mostLikedProject && (
          <Card
            title="Mon post le plus liké"
            icon={<Trophy size={16} className="text-yellow-500" />}
            className="mb-8"
          >
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {data.stats.mostLikedProject.title}
              {' · '}
              <span className="font-bold text-red-700">{data.stats.mostLikedProject.likes}❤️</span>
            </p>
          </Card>
        )}

        {/* Trophées */}
        <Card
          title={`Trophées (${filteredTrophies.length})`}
          icon={<Trophy size={16} className="text-yellow-500" />}
          action={
            <div className="flex gap-1.5">
              {(['all', 'earned', 'locked'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f ? FILTER_STYLES[f] : 'text-[var(--text-muted)] hover:bg-[var(--border-light)]'
                  }`}
                >
                  {f === 'all' && `Tous (${data.progress.length})`}
                  {f === 'earned' && `Acquis (${earnedTrophies.length})`}
                  {f === 'locked' && `Verrouillés (${lockedTrophies.length})`}
                </button>
              ))}
            </div>
          }
          className="mb-8"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrophies.map((trophy: TrophyType) => {
              const isEarned = earnedIds.has(trophy.id);
              const colors = RARITY_COLORS[trophy.rarity] ?? RARITY_COLORS.commun;
              const earnedData = data.earned.find((e) => e.id === trophy.id);

              return (
                <div
                  key={trophy.id}
                  className={`rounded-2xl border-2 p-4 transition-all ${
                    isEarned
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-light)] opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <p className={`font-semibold ${isEarned ? colors.text : 'text-[var(--text-muted)]'}`}>
                        {trophy.title}
                      </p>
                      <p className={`text-xs mt-1 ${isEarned ? 'opacity-75' : 'text-[var(--text-muted)]'}`}>
                        {trophy.description}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${colors.badge}`}>
                      {trophy.rarity}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Progression : {trophy.progress} / {trophy.threshold}</span>
                      {isEarned && <span className="text-yellow-500 font-bold">+{trophy.points} pts</span>}
                    </div>
                    {!isEarned && (
                      <ProgressBar value={(trophy.progress / trophy.threshold) * 100} size="sm" />
                    )}
                    {isEarned && earnedData?.awarded_at && (
                      <p className="text-[var(--text-muted)]">
                        Obtenu le {new Date(earnedData.awarded_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Paliers */}
        <Card title="Les paliers" icon={<Stars size={16} className="text-pink-500" />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LEVELS.map((level) => {
              const active = data.level === level.name;
              return (
                <div
                  key={level.name}
                  className={`glass-card p-4 rounded-xl transition-all ${
                    active ? 'border-purple-500/40 bg-purple-500/10 !shadow-[0_0_20px_rgba(168,85,247,0.12)]' : 'border-[var(--border-light)]'
                  }`}
                >
                  <p className="text-2xl mb-2">{level.icon}</p>
                  <p className="font-semibold text-[var(--text-primary)]">{level.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{level.range}</p>
                  {active && (
                    <p className="mt-2 text-xs font-semibold text-purple-500 flex items-center gap-1">
                      ✓ Niveau actuel
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
