import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Sparkles, Trophy, Gift, Stars, Heart, Zap, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

export default function RewardsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => api.get('/rewards/me').then((r) => r.data),
    enabled: !!user,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (data?.notifications) {
      if (data.notifications.newTrophies?.length > 0) {
        data.notifications.newTrophies.forEach((trophy: any) => {
          notify({
            type: 'trophy',
            title: `🏆 ${trophy.title}`,
            description: trophy.description,
          });
        });
      }
      if (data.notifications.levelChanged) {
        notify({
          type: 'level',
          title: `⭐ Nouveau niveau: ${data.notifications.levelChanged.level}`,
          description: 'Vous avez atteint un nouveau palier!',
        });
      }
    }
  }, [data?.notifications, notify]);

  const participateMutation = useMutation({
    mutationFn: () => api.post('/rewards/participate'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      if (res.data.participation.status === 'won') {
        notify({
          type: 'success',
          title: '🎉 Gagné!',
          description: res.data.participation.prize,
        });
      } else {
        notify({
          type: 'info',
          title: 'Participation enregistrée',
          description: res.data.participation.prize,
        });
      }
    },
    onError: () => {
      notify({ type: 'error', title: 'Erreur', description: 'Impossible de participer pour le moment.' });
    },
  });

  if (isLoading || !data) {
    return <div className="p-8 text-center text-[var(--text-muted)]">Chargement des récompenses...</div>;
  }

  const stats = data.stats || { ideaCount: 0, votesGivenCount: 0, totalLikes: 0, mostLikedProject: null, participationCount: 0 };
  const progress = data.progress || [];
  const earned = data.earned || [];
  const allTrophies = progress;

  const earmarkedIds = new Set(earned.map((t: any) => t.id));
  const earnedTrophies = allTrophies.filter((t: any) => earmarkedIds.has(t.id));
  const lockedTrophies = allTrophies.filter((t: any) => !earmarkedIds.has(t.id));

  let filteredTrophies = allTrophies;
  if (filter === 'earned') filteredTrophies = earnedTrophies;
  if (filter === 'locked') filteredTrophies = lockedTrophies;

  const rarityColors: Record<string, { bg: string; text: string; badge: string }> = {
    commun: { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-800' },
    rare: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-200 text-blue-900' },
    epique: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-200 text-purple-900' },
    legendaire: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-200 text-yellow-900' },
  };

  return (
    <div className="min-h-[calc(100vh-56px)] page-enter">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Récompenses et trophées
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Suivez votre progression, débloquez des trophées et participez aux tirages.
            </p>
          </div>
          <button
            onClick={() => participateMutation.mutate()}
            disabled={participateMutation.isPending}
            className="btn-accent flex items-center gap-2 shrink-0"
          >
            <Gift size={16} /> Participer au tirage
          </button>
        </div>

        {/* Niveau et Points */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2 glass-card-static p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Niveau et Progression</h2>

            <div className="flex items-center justify-between mb-8 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">Votre niveau</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{data.level}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">Points</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{data.points}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Progression vers <strong>{data.nextLevel}</strong></span>
                <span className="text-[var(--text-muted)]">{data.pointsForNextLevel} points restants</span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${data.progressToNextLevel}%` }}
                />
              </div>
            </div>
          </div>

          <div className="glass-card-static p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Résumé</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]">
                <Zap size={16} className="text-yellow-500" />
                <div className="flex-1">
                  <p className="text-xs text-[var(--text-muted)]">Idées postées</p>
                  <p className="font-bold text-[var(--text-primary)]">{stats.ideaCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]">
                <Heart size={16} className="text-red-500" />
                <div className="flex-1">
                  <p className="text-xs text-[var(--text-muted)]">Likes reçus</p>
                  <p className="font-bold text-[var(--text-primary)]">{stats.totalLikes}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]">
                <TrendingUp size={16} className="text-emerald-500" />
                <div className="flex-1">
                  <p className="text-xs text-[var(--text-muted)]">Votes donnés</p>
                  <p className="font-bold text-[var(--text-primary)]">{stats.votesGivenCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Post le plus liké */}
        {stats.mostLikedProject && (
          <div className="mb-8 glass-card-static p-6 border-l-4 border-yellow-500">
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={18} className="text-yellow-500" />
              <h3 className="font-semibold text-[var(--text-primary)]">Post le plus liké</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-bold">{stats.mostLikedProject.title}</span> avec <span className="font-bold text-yellow-600">{stats.mostLikedProject.likes} ❤️</span>
            </p>
          </div>
        )}

        {/* Trophées */}
        <div className="glass-card-static p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-yellow-500" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Trophées ({filteredTrophies.length})</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-500/20 text-purple-600 font-medium'
                    : 'text-[var(--text-muted)] hover:bg-[var(--border-light)]'
                }`}
              >
                Tous ({allTrophies.length})
              </button>
              <button
                onClick={() => setFilter('earned')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === 'earned'
                    ? 'bg-emerald-500/20 text-emerald-600 font-medium'
                    : 'text-[var(--text-muted)] hover:bg-[var(--border-light)]'
                }`}
              >
                Acquis ({earnedTrophies.length})
              </button>
              <button
                onClick={() => setFilter('locked')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === 'locked'
                    ? 'bg-gray-500/20 text-gray-600 font-medium'
                    : 'text-[var(--text-muted)] hover:bg-[var(--border-light)]'
                }`}
              >
                Verrouillés ({lockedTrophies.length})
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrophies.map((trophy: any) => {
              const isEarned = earmarkedIds.has(trophy.id);
              const colors = rarityColors[trophy.rarity] || rarityColors.commun;
              const earnedData = earned.find((e: any) => e.id === trophy.id);

              return (
                <div
                  key={trophy.id}
                  className={`rounded-2xl border-2 p-4 transition-all ${
                    isEarned
                      ? `${colors.bg} ${colors.text} border-${trophy.rarity === 'legendaire' ? 'yellow' : trophy.rarity === 'epique' ? 'purple' : trophy.rarity === 'rare' ? 'blue' : 'gray'}-300`
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-light)] opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <p className={`font-semibold ${isEarned ? colors.text : 'text-[var(--text-muted)]'}`}>
                        {trophy.title}
                      </p>
                      <p className={`text-xs ${isEarned ? 'opacity-75' : 'text-[var(--text-muted)]'} mt-1`}>
                        {trophy.description}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${colors.badge}`}>
                      {trophy.rarity}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Progression: {trophy.progress} / {trophy.threshold}</span>
                      {isEarned && (
                        <span className="text-yellow-600 font-bold">+{trophy.points} pts</span>
                      )}
                    </div>
                    {!isEarned && (
                      <div className="h-1.5 rounded-full bg-[var(--border-light)] overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${Math.min((trophy.progress / trophy.threshold) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                    {isEarned && earnedData && (
                      <p className="text-[var(--text-muted)]">
                        Obtenu le {new Date(earnedData.awarded_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Paliers */}
        <div className="glass-card-static p-6 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Stars size={20} className="text-pink-500" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Les paliers</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Nouvel arrivant', icon: '🌱', range: '0 - 49 points' },
              { name: 'Explorateur', icon: '🧭', range: '50 - 149 points' },
              { name: 'Innovateur', icon: '💡', range: '150 - 299 points' },
              { name: 'Actionnaire', icon: '📈', range: '300 - 599 points' },
              { name: 'Directeur', icon: '🎩', range: '600 - 999 points' },
              { name: 'Visionnaire', icon: '✨', range: '1000+ points' },
            ].map((level) => (
              <div key={level.name} className={`glass-card p-4 border rounded-xl transition-all ${data.level === level.name ? 'border-purple-500/50 bg-purple-500/10' : 'border-[var(--border-light)]'}`}>
                <p className="text-2xl mb-2">{level.icon}</p>
                <p className="font-semibold text-[var(--text-primary)]">{level.name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">{level.range}</p>
                {data.level === level.name && (
                  <div className="mt-2 text-xs font-semibold text-purple-600 flex items-center gap-1">
                    ✓ Niveau actuel
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
