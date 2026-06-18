import { Plus, Sparkles, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { PROMOS, SPECIALTIES } from '../../constants/promos';
import type { EditableTeam, TeamAssignMode } from '../../hooks/useDashboard';
import type { useDashboard } from '../../hooks/useDashboard';
import type { Team } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import InputField from '../ui/InputField';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';
import SelectField from '../ui/SelectField';

type Dashboard = ReturnType<typeof useDashboard>;

const MODES: { value: TeamAssignMode; label: string }[] = [
  { value: 'create', label: 'Nouvelle équipe' },
  { value: 'existing', label: 'Équipe existante' },
];

function TeamCard({ team, i, existingTeams, onUpdate, onRemove }: {
  team: EditableTeam; i: number; existingTeams: Team[];
  onUpdate: (i: number, p: Partial<EditableTeam>) => void;
  onRemove: (teamIdx: number, memberId: string) => void;
}) {
  return (
    <div className="glass-card-static rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[var(--border-light)] space-y-3">
        <div className="flex gap-2">
          {MODES.map(({ value, label }) => (
            <button key={value} onClick={() => onUpdate(i, { mode: value })}
              className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                team.mode === value
                  ? 'bg-purple-500 text-white border-purple-500'
                  : 'text-[var(--text-muted)] border-[var(--border-light)] hover:border-purple-400'
              }`}>
              {label}
            </button>
          ))}
        </div>
        {team.mode === 'create'
          ? <InputField label="Nom de la nouvelle équipe" value={team.name} placeholder="Nom de l'équipe" onChange={(v) => onUpdate(i, { name: v })} />
          : <SelectField label="Affecter à" value={team.existingTeamId} placeholder="Choisir une équipe existante"
              options={existingTeams.map((t) => ({ value: t.id, label: t.name }))}
              onChange={(v) => onUpdate(i, { existingTeamId: v })} />
        }
      </div>
      <div className="divide-y divide-[var(--border-light)]">
        {team.members.length === 0
          ? <p className="px-4 py-3 text-xs text-[var(--text-muted)]">Aucun membre</p>
          : team.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <span className="font-medium text-[var(--text-primary)]">{m.first_name} {m.last_name}</span>
                <span className="text-xs text-[var(--text-muted)] ml-2">{m.email}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {m.promo && <span className="text-xs bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded px-2 py-0.5">{m.promo}</span>}
                {m.specialty && <span className="text-xs text-[var(--text-muted)] max-w-[120px] truncate" title={m.specialty}>{m.specialty}</span>}
                {m.affinityScore > 0 && <span className="text-xs text-purple-500 font-semibold">+{m.affinityScore} pts</span>}
                <button onClick={() => onRemove(i, m.id)} title="Retirer" className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default function TeamsTab({ dashboard: d }: { dashboard: Dashboard }) {
  const {
    teams, loadingTeams, users, loadingUsers,
    createTeam, deleteTeam, assignTeam,
    teamSize, setTeamSize, filterPromo, setFilterPromo, filterSpecialty, setFilterSpecialty,
    preview, editableTeams, autoGenerate, autoAssign,
    updateTeam, removeMember, resetPreview,
  } = d;

  const [newTeamName, setNewTeamName] = useState('');
  const specialties = filterPromo ? (SPECIALTIES[filterPromo] ?? []) : [];

  const canApply =
    !autoAssign.isPending &&
    editableTeams.some((t) => t.members.length > 0) &&
    editableTeams.every((t) => t.members.length === 0 || t.mode !== 'existing' || t.existingTeamId);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-1 space-y-6">
          <Card title="Créer une équipe" icon={<Plus size={15} />}>
            <div className="space-y-4">
              <InputField label="Nom de l'équipe" placeholder="ex : M2 Dev" value={newTeamName} onChange={setNewTeamName} />
              <Button fullWidth disabled={createTeam.isPending || !newTeamName.trim()}
                onClick={() => createTeam.mutate(newTeamName.trim(), { onSuccess: () => setNewTeamName('') })}>
                {createTeam.isPending ? 'Création...' : "Créer l'équipe"}
              </Button>
            </div>
          </Card>

          <Card title={`Équipes (${teams.length})`} icon={<Users size={15} />}>
            {loadingTeams ? <LoadingState /> : (
              <ul className="space-y-2">
                {teams.length === 0 && <li className="text-xs text-[var(--text-muted)] text-center py-2">Aucune équipe</li>}
                {teams.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm font-medium p-2 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)]">
                    <span>{t.name}</span>
                    <button onClick={() => deleteTeam.mutate(t.id)} disabled={deleteTeam.isPending} className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-0.5">
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card title="Affectation des étudiants" icon={<Users size={15} />} className="col-span-2">
          {loadingUsers ? <LoadingState text="Chargement..." /> : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] sticky top-0">
                  <tr>
                    {['Étudiant', 'Promo / Spé', 'Rôle', 'Équipe'].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text-primary)]">{u.first_name || 'Inconnu'} {u.last_name || ''}</div>
                        <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {u.promo
                          ? <div>
                              <span className="text-xs font-semibold text-[var(--text-primary)]">{u.promo}</span>
                              {u.specialty && <div className="text-xs text-[var(--text-muted)] truncate max-w-[140px]" title={u.specialty}>{u.specialty}</div>}
                            </div>
                          : <span className="text-xs text-[var(--text-muted)]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.role === 'admin' ? 'badge-idea' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-light)]'}`}>
                          {u.role === 'admin' ? 'Pédagogie' : 'Étudiant'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SelectField
                          value={u.team_id || ''}
                          onChange={(v) => assignTeam.mutate({ userId: u.id, teamId: v || null })}
                          options={[{ value: '', label: '— Aucune —' }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Génération automatique */}
      <div className="border-t border-[var(--border-light)] pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={18} className="text-purple-500" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Génération automatique d'équipes</h2>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <Card title="Paramètres" icon={<Sparkles size={15} />}>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--text-secondary)] mb-2">Taille des équipes</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={2} max={8} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="flex-1" />
                  <span className="text-sm font-bold text-[var(--text-primary)] w-6 text-center">{teamSize}</span>
                </div>
              </div>

              <SelectField label="Filtrer par promo" value={filterPromo} onChange={setFilterPromo} placeholder="Choisir"
                options={[{ value: '', label: 'Toutes les promos (répartition équilibrée)' }, ...PROMOS.map((p) => ({ value: p, label: p }))]} />

              {specialties.length > 0 && (
                <SelectField label="Filtrer par spécialité" value={filterSpecialty} onChange={setFilterSpecialty}
                  placeholder="Toutes les spécialités" options={specialties.map((s) => ({ value: s, label: s }))} />
              )}

              <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-lg p-3 border border-[var(--border-light)]">
                {filterPromo
                  ? <><strong>Mode affinité</strong><br />Top 1 = 3 pts · Top 2 = 2 pts · Top 3 = 1 pt · Like = 0.5 pt</>
                  : <><strong>Mode équilibré</strong><br />Par promo + spécialité pour diversifier les profils.</>
                }
              </p>

              <Button fullWidth onClick={() => autoGenerate.mutate()} disabled={autoGenerate.isPending}>
                {autoGenerate.isPending ? 'Calcul...' : 'Générer un aperçu'}
              </Button>
            </div>
          </Card>

          <div className="col-span-2">
            {!preview && !autoGenerate.isPending && (
              <EmptyState dashed title="Configurez les paramètres puis générez un aperçu" />
            )}

            {autoGenerate.isPending && <LoadingState text="Calcul des affinités..." />}

            {preview && !autoGenerate.isPending && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-lg px-3 py-1.5 font-semibold ${preview.stats.mode === 'balanced' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'}`}>
                    {preview.stats.mode === 'balanced' ? 'Répartition équilibrée' : 'Répartition par affinité'}
                  </span>
                  {([
                    ['étudiants', preview.stats.totalStudents],
                    ['avec préférences', preview.stats.studentsWithPreferences],
                    ['sans préférences', preview.stats.studentsWithoutPreferences],
                    ['équipes', editableTeams.length],
                  ] as [string, number][]).map(([label, value]) => (
                    <span key={label} className="bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-lg px-3 py-1.5">
                      <strong>{value}</strong> {label}
                    </span>
                  ))}
                </div>

                <div className="max-h-[520px] overflow-y-auto space-y-4 pr-1">
                  {editableTeams.map((team, i) => (
                    <TeamCard key={i} team={team} i={i} existingTeams={teams} onUpdate={updateTeam} onRemove={removeMember} />
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <Button onClick={() => autoAssign.mutate()} disabled={!canApply}>
                    {autoAssign.isPending ? 'Application...' : `Appliquer (${editableTeams.filter((t) => t.members.length > 0).length} équipes)`}
                  </Button>
                  <button onClick={resetPreview} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                    Annuler
                  </button>
                  {autoAssign.isSuccess && <span className="text-sm text-green-500 font-medium">Équipes créées !</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
