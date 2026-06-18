import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Plus, Sparkles, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import InputField from '../components/ui/InputField';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import SelectField from '../components/ui/SelectField';
import { PROMOS, SPECIALTIES } from '../constants/promos';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../services/dashboard.service';
import { teamService, type AutoGenerateResult, type ProposedTeam } from '../services/team.service';
import { topProjectService } from '../services/topProject.service';
import { userService } from '../services/user.service';
import type { AdminVote, Profile, ProjectStat, Team, TeamStats } from '../types';

type Tab = 'votes' | 'teams' | 'rankings';

interface Stats {
  byLikes: ProjectStat[];
  byTopScore: ProjectStat[];
}

// Per-team assignment mode in the preview
type TeamAssignMode = 'create' | 'existing';

interface EditableTeam extends ProposedTeam {
  mode: TeamAssignMode;
  existingTeamId: string;
}

function toEditable(teams: ProposedTeam[]): EditableTeam[] {
  return teams.map((t) => ({ ...t, mode: 'create', existingTeamId: '' }));
}

export default function DashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('votes');
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const queryClient = useQueryClient();

  // Auto-generate state
  const [teamSize, setTeamSize] = useState(4);
  const [filterPromo, setFilterPromo] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [preview, setPreview] = useState<AutoGenerateResult | null>(null);
  const [editableTeams, setEditableTeams] = useState<EditableTeam[]>([]);

  const availableSpecialties = filterPromo ? (SPECIALTIES[filterPromo] ?? []) : [];

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

  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => teamService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

  const autoGenerateMutation = useMutation({
    mutationFn: () => teamService.autoGenerate(teamSize, filterPromo || undefined, filterSpecialty || undefined),
    onSuccess: (result) => {
      setPreview(result);
      setEditableTeams(toEditable(result.teams));
    },
  });

  const autoAssignMutation = useMutation({
    mutationFn: () => {
      const payload = editableTeams
        .filter((t) => t.members.length > 0)
        .map((t) =>
          t.mode === 'existing' && t.existingTeamId
            ? { existingTeamId: t.existingTeamId, memberIds: t.members.map((m) => m.id) }
            : { name: t.name, memberIds: t.members.map((m) => m.id) },
        );
      return teamService.autoAssign(payload as any);
    },
    onSuccess: () => {
      setPreview(null);
      setEditableTeams([]);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Editable team helpers
  const updateTeam = (index: number, patch: Partial<EditableTeam>) =>
    setEditableTeams((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));

  const removeMember = (teamIndex: number, memberId: string) =>
    setEditableTeams((prev) =>
      prev.map((t, i) =>
        i === teamIndex ? { ...t, members: t.members.filter((m) => m.id !== memberId) } : t,
      ),
    );

  const existingTeamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  if (loading) return <LoadingState fullPage />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-[calc(100vh-56px)] page-enter">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          icon={<LayoutDashboard size={24} className="text-[var(--accent-2)]" />}
          title="Dashboard"
          description="Gestion des votes, classements et équipes étudiantes."
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
                  {tab === 'votes' ? 'Votes des étudiants' : tab === 'rankings' ? 'Classements' : 'Gestion des équipes'}
                </button>
              ))}
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)] py-2">Accès réservé à la pédagogie</p>
          )}
        </div>

        {/* ── TAB: VOTES ── */}
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
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Équipe</th>
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

        {/* ── TAB: RANKINGS ── */}
        {isAdmin && activeTab === 'rankings' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Filtrer par équipe :</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="input-modern text-sm py-1.5 px-3"
              >
                <option value="">Toutes les équipes</option>
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
                  <div className="p-8 text-center text-[var(--text-muted)]">Aucune donnée pour cette équipe.</div>
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
                  <div className="p-8 text-center text-[var(--text-muted)]">Aucun Top 3 pour cette équipe.</div>
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

        {/* ── TAB: TEAMS ── */}
        {isAdmin && activeTab === 'teams' && (
          <div className="space-y-8">
            {/* Manual management */}
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-1 space-y-6">
                <Card title="Créer une équipe" icon={<Plus size={15} />}>
                  <div className="space-y-4">
                    <InputField
                      label="Nom de l'équipe"
                      placeholder="ex : M2 Dev"
                      value={newTeamName}
                      onChange={setNewTeamName}
                    />
                    <Button
                      onClick={() => { if (newTeamName.trim()) createTeamMutation.mutate(newTeamName.trim()); }}
                      disabled={createTeamMutation.isPending || !newTeamName.trim()}
                      fullWidth
                    >
                      {createTeamMutation.isPending ? 'Création...' : "Créer l'équipe"}
                    </Button>
                  </div>
                </Card>

                <Card title={`Équipes existantes (${teams.length})`} icon={<Users size={15} />}>
                  {loadingTeams ? (
                    <LoadingState />
                  ) : (
                    <ul className="space-y-2">
                      {teams.map((t) => (
                        <li key={t.id} className="flex items-center justify-between text-sm text-[var(--text-secondary)] font-medium p-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-light)]">
                          <span>{t.name}</span>
                          <button
                            onClick={() => deleteTeamMutation.mutate(t.id)}
                            disabled={deleteTeamMutation.isPending}
                            className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-0.5"
                            title="Supprimer l'équipe"
                          >
                            <Trash2 size={13} />
                          </button>
                        </li>
                      ))}
                      {teams.length === 0 && (
                        <li className="text-xs text-[var(--text-muted)] text-center py-2">Aucune équipe créée</li>
                      )}
                    </ul>
                  )}
                </Card>
              </div>

              <Card title="Affectation des étudiants" icon={<Users size={15} />} className="col-span-2">
                {loadingUsers ? (
                  <LoadingState text="Chargement des étudiants..." />
                ) : (
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] sticky top-0">
                        <tr>
                          <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Étudiant</th>
                          <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Promo / Spé</th>
                          <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Rôle</th>
                          <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs w-44">Équipe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-light)]">
                        {usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-[var(--text-primary)]">
                                {u.first_name || 'Inconnu'} {u.last_name || ''}
                              </div>
                              <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              {u.promo ? (
                                <div>
                                  <span className="text-xs font-semibold text-[var(--text-primary)]">{u.promo}</span>
                                  {u.specialty && (
                                    <div className="text-xs text-[var(--text-muted)] truncate max-w-[140px]" title={u.specialty}>
                                      {u.specialty}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-[var(--text-muted)]">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${u.role === 'admin' ? 'badge-idea' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-light)]'}`}>
                                {u.role === 'admin' ? 'Pédagogie' : 'Étudiant'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
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

            {/* ── Auto-generation ── */}
            <div className="border-t border-[var(--border-light)] pt-8">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={18} className="text-purple-500" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">Génération automatique d'équipes</h2>
              </div>

              <div className="grid grid-cols-3 gap-8">
                {/* Config */}
                <Card title="Paramètres" icon={<Sparkles size={15} />}>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--text-secondary)] mb-2">
                        Taille des équipes
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={2}
                          max={8}
                          value={teamSize}
                          onChange={(e) => setTeamSize(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-bold text-[var(--text-primary)] w-6 text-center">{teamSize}</span>
                      </div>
                    </div>

                    <SelectField
                      label="Filtrer par promo"
                      value={filterPromo}
                      onChange={(v) => { setFilterPromo(v); setFilterSpecialty(''); }}
                      placeholder="Choisir"
                      options={[
                        { value: '', label: 'Toutes les promos (répartition équilibrée)' },
                        ...PROMOS.map((p) => ({ value: p, label: p })),
                      ]}
                    />

                    {availableSpecialties.length > 0 && (
                      <SelectField
                        label="Filtrer par spécialité"
                        value={filterSpecialty}
                        onChange={setFilterSpecialty}
                        placeholder="Toutes les spécialités"
                        options={availableSpecialties.map((s) => ({ value: s, label: s }))}
                      />
                    )}

                    <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-lg p-3 border border-[var(--border-light)] space-y-1">
                      {filterPromo ? (
                        <>
                          <p><strong>Mode affinité</strong> (promo filtrée)</p>
                          <p>· Top 1 partagé = 3 pts</p>
                          <p>· Top 2 partagé = 2 pts</p>
                          <p>· Top 3 partagé = 1 pt</p>
                          <p>· Like partagé = 0.5 pt</p>
                        </>
                      ) : (
                        <>
                          <p><strong>Mode équilibré</strong> (toutes promos)</p>
                          <p>Répartition round-robin par groupe promo + spécialité pour assurer la diversité des profils dans chaque équipe.</p>
                        </>
                      )}
                    </div>

                    <Button
                      onClick={() => autoGenerateMutation.mutate()}
                      disabled={autoGenerateMutation.isPending}
                      fullWidth
                    >
                      {autoGenerateMutation.isPending ? 'Calcul en cours...' : 'Générer un aperçu'}
                    </Button>
                  </div>
                </Card>

                {/* Preview */}
                <div className="col-span-2">
                  {!preview && !autoGenerateMutation.isPending && (
                    <div className="flex items-center justify-center h-full min-h-[200px] rounded-xl border-2 border-dashed border-[var(--border-light)]">
                      <p className="text-sm text-[var(--text-muted)]">Configurez les paramètres et cliquez sur "Générer un aperçu"</p>
                    </div>
                  )}

                  {autoGenerateMutation.isPending && (
                    <LoadingState text="Calcul des affinités en cours..." />
                  )}

                  {preview && !autoGenerateMutation.isPending && (
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-lg px-3 py-1.5 font-semibold ${preview.stats.mode === 'balanced' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'}`}>
                          {preview.stats.mode === 'balanced' ? 'Répartition équilibrée' : 'Répartition par affinité'}
                        </span>
                        {[
                          { label: 'étudiants', value: preview.stats.totalStudents },
                          { label: 'avec préférences', value: preview.stats.studentsWithPreferences },
                          { label: 'sans préférences', value: preview.stats.studentsWithoutPreferences },
                          { label: 'équipes', value: editableTeams.length },
                        ].map(({ label, value }) => (
                          <span key={label} className="bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-lg px-3 py-1.5">
                            <strong>{value}</strong> {label}
                          </span>
                        ))}
                      </div>

                      {/* Teams list */}
                      <div className="max-h-[520px] overflow-y-auto space-y-4 pr-1">
                        {editableTeams.map((team, ti) => (
                          <div key={ti} className="glass-card-static rounded-xl overflow-hidden">
                            {/* Header */}
                            <div className="px-4 pt-4 pb-3 bg-[var(--bg-elevated)] border-b border-[var(--border-light)] space-y-3">
                              {/* Mode toggle */}
                              <div className="flex gap-2">
                                {(['create', 'existing'] as TeamAssignMode[]).map((m) => (
                                  <button
                                    key={m}
                                    onClick={() => updateTeam(ti, { mode: m })}
                                    className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${team.mode === m ? 'bg-purple-500 text-white border-purple-500' : 'bg-transparent text-[var(--text-muted)] border-[var(--border-light)] hover:border-purple-400'}`}
                                  >
                                    {m === 'create' ? 'Nouvelle équipe' : 'Équipe existante'}
                                  </button>
                                ))}
                              </div>

                              {/* Name input or existing team select */}
                              {team.mode === 'create' ? (
                                <InputField
                                  label="Nom de la nouvelle équipe"
                                  value={team.name}
                                  onChange={(v) => updateTeam(ti, { name: v })}
                                  placeholder="Nom de l'équipe"
                                />
                              ) : (
                                <SelectField
                                  label="Affecter à"
                                  value={team.existingTeamId}
                                  onChange={(v) => updateTeam(ti, { existingTeamId: v })}
                                  options={existingTeamOptions}
                                  placeholder="Choisir une équipe existante"
                                />
                              )}

                              {team.sharedProjects.length > 0 && (
                                <p className="text-xs text-[var(--text-muted)]">
                                  Intérêts communs : {team.sharedProjects.slice(0, 2).join(', ')}
                                  {team.sharedProjects.length > 2 && ` +${team.sharedProjects.length - 2}`}
                                </p>
                              )}
                            </div>

                            {/* Members */}
                            <div className="divide-y divide-[var(--border-light)]">
                              {team.members.map((m) => (
                                <div key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                  <div>
                                    <span className="font-medium text-[var(--text-primary)]">{m.first_name} {m.last_name}</span>
                                    <span className="text-xs text-[var(--text-muted)] ml-2">{m.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {m.promo && (
                                      <span className="text-xs bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded px-2 py-0.5">{m.promo}</span>
                                    )}
                                    {m.specialty && (
                                      <span className="text-xs text-[var(--text-muted)] max-w-[120px] truncate" title={m.specialty}>{m.specialty}</span>
                                    )}
                                    {m.affinityScore > 0 && (
                                      <span className="text-xs text-purple-500 font-semibold">+{m.affinityScore} pts</span>
                                    )}
                                    <button
                                      onClick={() => removeMember(ti, m.id)}
                                      className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                      title="Retirer de l'équipe"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {team.members.length === 0 && (
                                <div className="px-4 py-3 text-xs text-[var(--text-muted)]">Aucun membre</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Apply */}
                      <div className="flex items-center gap-4 pt-1">
                        <Button
                          onClick={() => autoAssignMutation.mutate()}
                          disabled={
                            autoAssignMutation.isPending ||
                            editableTeams.every((t) => t.members.length === 0) ||
                            editableTeams.some((t) => t.mode === 'existing' && !t.existingTeamId)
                          }
                        >
                          {autoAssignMutation.isPending
                            ? 'Application...'
                            : `Appliquer (${editableTeams.filter((t) => t.members.length > 0).length} équipes)`}
                        </Button>
                        <button
                          onClick={() => { setPreview(null); setEditableTeams([]); }}
                          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          Annuler
                        </button>
                        {autoAssignMutation.isSuccess && (
                          <span className="text-sm text-green-500 font-medium">Équipes créées et membres affectés !</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
