import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import InputField from '../components/ui/InputField';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../services/dashboard.service';
import { teamService } from '../services/team.service';
import { topProjectService } from '../services/topProject.service';
import { userService } from '../services/user.service';
import type { AdminVote, Profile, ProjectStat, Team, TeamStats } from '../types';

type Tab = 'votes' | 'teams' | 'rankings';

interface Stats {
  byLikes: ProjectStat[];
  byTopScore: ProjectStat[];
}

export default function DashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('votes');
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: votes = [], isLoading: loadingVotes } = useQuery<AdminVote[]>({
    queryKey: ['admin-votes'],
    queryFn: () => dashboardService.getVotes(),
    enabled: isAdmin,
  });

  const { data: teams = [], isLoading: loadingTeams } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => teamService.getAll(),
    enabled: isAdmin,
  });

  const { data: usersList = [], isLoading: loadingUsers } = useQuery<Profile[]>({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
    enabled: isAdmin,
  });

  const { data: globalStats } = useQuery<Stats>({
    queryKey: ['top-stats'],
    queryFn: () => topProjectService.getGlobalStats(),
    enabled: isAdmin,
  });

  const { data: teamStatsList = [] } = useQuery<TeamStats[]>({
    queryKey: ['top-stats-teams'],
    queryFn: () => topProjectService.getStatsByTeam(),
    enabled: isAdmin,
  });

  const statsToShow: Stats | undefined = selectedTeamId
    ? teamStatsList.find((t) => t.team_id === selectedTeamId)
    : globalStats;

  const createTeamMutation = useMutation({
    mutationFn: (name: string) => teamService.create(name),
    onSuccess: () => {
      setNewTeamName('');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const assignTeamMutation = useMutation({
    mutationFn: ({ userId, teamId }: { userId: string; teamId: string | null }) =>
      userService.assignTeam(userId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-votes'] });
    },
  });

  if (loading) {
    return <LoadingState fullPage />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-56px)] page-enter">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          icon={<LayoutDashboard size={24} className="text-[var(--accent-2)]" />}
          title="Dashboard"
          description="Gestion des votes, classements et classes étudiantes."
        />

        <div className="flex gap-4 mb-8 border-b border-[var(--border-light)] pb-2">
          {isAdmin ? (
            <>
              {(['votes', 'rankings', 'teams'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${activeTab === tab ? 'text-[var(--text-primary)] border-purple-500' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'}`}
                >
                  {tab === 'votes' ? 'Votes des étudiants' : tab === 'rankings' ? 'Classements' : 'Gestion des classes'}
                </button>
              ))}
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)] py-2">Accès réservé à la pédagogie</p>
          )}
        </div>

        {isAdmin && activeTab === 'votes' && (
          <div className="glass-card-static rounded-xl overflow-hidden shadow-sm">
            {loadingVotes ? (
              <LoadingState text="Chargement des votes..." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Étudiant</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Classe</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Projet voté</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Thème du projet</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {votes.map((v) => (
                      <tr key={v.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-[var(--text-primary)]">
                            {v.users.first_name} {v.users.last_name}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">{v.users.email}</div>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                          {v.users.teams?.name || '-'}
                        </td>
                        <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                          {v.projects.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`theme-badge theme-badge-${v.projects.theme.toLowerCase()}`}>
                            {v.projects.theme}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-muted)]">
                          {new Date(v.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                    {votes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">
                          Aucun vote enregistré pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {isAdmin && activeTab === 'rankings' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Filtrer par classe :</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="input-modern text-sm py-1.5 px-3"
              >
                <option value="">Toutes les classes</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="glass-card-static rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[var(--border-light)] flex items-center gap-2">
                  <span className="text-lg">❤️</span>
                  <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Projets les plus likés
                  </h2>
                </div>
                {!statsToShow ? (
                  <div className="p-8 text-center text-[var(--text-muted)]">Chargement...</div>
                ) : statsToShow.byLikes.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-muted)]">Aucune donnée pour cette classe.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-xs w-10">#</th>
                        <th className="px-4 py-3 font-semibold text-xs">Projet</th>
                        <th className="px-4 py-3 font-semibold text-xs w-16 text-center">Likes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)]">
                      {statsToShow.byLikes.slice(0, 20).map((p, i) => (
                        <tr key={p.project_id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <td className="px-4 py-3 text-[var(--text-muted)] font-bold">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--text-primary)]">{p.title}</div>
                            <div className="text-xs text-[var(--text-muted)]">{p.theme}{p.specialty ? ` · ${p.specialty}` : ''}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-[var(--text-primary)]">{p.likes}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="glass-card-static rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[var(--border-light)] flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Projets mieux classés (Top 3)
                  </h2>
                </div>
                {!statsToShow ? (
                  <div className="p-8 text-center text-[var(--text-muted)]">Chargement...</div>
                ) : statsToShow.byTopScore.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-muted)]">Aucun Top 3 pour cette classe.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-xs w-10">#</th>
                        <th className="px-4 py-3 font-semibold text-xs">Projet</th>
                        <th className="px-4 py-3 font-semibold text-xs w-16 text-center">Pts</th>
                        <th className="px-4 py-3 font-semibold text-xs w-20 text-center">Top 1</th>
                        <th className="px-4 py-3 font-semibold text-xs w-20 text-center">Top 2</th>
                        <th className="px-4 py-3 font-semibold text-xs w-20 text-center">Top 3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)]">
                      {statsToShow.byTopScore.slice(0, 20).map((p, i) => (
                        <tr key={p.project_id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <td className="px-4 py-3 text-[var(--text-muted)] font-bold">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--text-primary)]">{p.title}</div>
                            <div className="text-xs text-[var(--text-muted)]">{p.theme}{p.specialty ? ` · ${p.specialty}` : ''}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-[var(--text-primary)]">{p.topScore}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{p.top1Count}</td>
                          <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{p.top2Count}</td>
                          <td className="px-4 py-3 text-center text-[var(--text-secondary)]">{p.top3Count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-lg p-3 border border-[var(--border-light)]">
              <strong>Calcul des points :</strong> #1 = 3 pts · #2 = 2 pts · #3 = 1 pt
            </div>
          </div>
        )}

        {isAdmin && activeTab === 'teams' && (
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-1 space-y-6">
              <Card title="Créer une classe" icon={<Plus size={15} />}>
                <div className="space-y-4">
                  <InputField
                    label="Nom de la classe"
                    placeholder="ex : M2 Dev"
                    value={newTeamName}
                    onChange={setNewTeamName}
                  />
                  <Button
                    onClick={() => { if (newTeamName.trim()) createTeamMutation.mutate(newTeamName.trim()); }}
                    disabled={createTeamMutation.isPending || !newTeamName.trim()}
                    fullWidth
                  >
                    {createTeamMutation.isPending ? 'Création...' : 'Créer la classe'}
                  </Button>
                </div>
              </Card>

              <Card title={`Classes existantes (${teams.length})`} icon={<Users size={15} />}>
                {loadingTeams ? (
                  <LoadingState />
                ) : (
                  <ul className="space-y-2">
                    {teams.map((t) => (
                      <li key={t.id} className="text-sm text-[var(--text-secondary)] font-medium p-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-light)]">
                        {t.name}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card
              title="Affectation des étudiants"
              icon={<Users size={15} />}
              className="col-span-2"
            >
              {loadingUsers ? (
                <LoadingState text="Chargement des étudiants..." />
              ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] sticky top-0">
                      <tr>
                        <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">Étudiant</th>
                        <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">Rôle</th>
                        <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs w-48">Classe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)]">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <td className="px-6 py-3">
                            <div className="font-medium text-[var(--text-primary)]">
                              {u.first_name || 'Inconnu'} {u.last_name || ''}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`badge ${u.role === 'admin' ? 'badge-idea' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-light)]'}`}>
                              {u.role === 'admin' ? 'Pédagogie' : 'Étudiant'}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <select
                              value={u.team_id || ''}
                              onChange={(e) => assignTeamMutation.mutate({ userId: u.id, teamId: e.target.value || null })}
                              className="input-modern text-xs py-1.5 px-3 w-full"
                              disabled={assignTeamMutation.isPending}
                            >
                              <option value="">-- Aucune --</option>
                              {teams.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
