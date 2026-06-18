import type { ProjectStat, Team, TeamStats } from '../../types';
import type { Stats } from '../../hooks/useDashboard';

interface Props {
  teams: Team[];
  globalStats?: Stats;
  teamStatsList: TeamStats[];
  selectedTeamId: string;
  onSelectTeam: (id: string) => void;
}

const MEDAL = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

function RankingTable({ icon, title, rows, cols }: {
  icon: string;
  title: string;
  rows: ProjectStat[];
  cols: { label: string; render: (p: ProjectStat) => React.ReactNode }[];
}) {
  return (
    <div className="glass-card-static rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[var(--border-light)] flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-8 text-center text-[var(--text-muted)]">Aucune donnée pour cette sélection.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-semibold text-xs w-10">#</th>
              <th className="px-4 py-3 font-semibold text-xs">Projet</th>
              {cols.map((c) => <th key={c.label} className="px-4 py-3 font-semibold text-xs text-center">{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {rows.slice(0, 20).map((p, i) => (
              <tr key={p.project_id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="px-4 py-3 font-bold text-[var(--text-muted)]">{MEDAL(i)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--text-primary)]">{p.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">{p.theme}{p.specialty ? ` · ${p.specialty}` : ''}</div>
                </td>
                {cols.map((c) => <td key={c.label} className="px-4 py-3 text-center text-[var(--text-secondary)]">{c.render(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function RankingsTab({ teams, globalStats, teamStatsList, selectedTeamId, onSelectTeam }: Props) {
  const stats = selectedTeamId ? teamStatsList.find((t) => t.team_id === selectedTeamId) : globalStats;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Filtrer par équipe :</label>
        <select value={selectedTeamId} onChange={(e) => onSelectTeam(e.target.value)} className="input-modern text-sm py-1.5 px-3">
          <option value="">Toutes les équipes</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {!stats ? (
        <p className="text-center text-[var(--text-muted)] py-8">Chargement...</p>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          <RankingTable
            icon="❤️" title="Projets les plus likés" rows={stats.byLikes}
            cols={[{ label: 'Likes', render: (p) => <strong className="text-[var(--text-primary)]">{p.likes}</strong> }]}
          />
          <RankingTable
            icon="🏆" title="Mieux classés (Top 3)" rows={stats.byTopScore}
            cols={[
              { label: 'Pts', render: (p) => <strong className="text-[var(--text-primary)]">{p.topScore}</strong> },
              { label: 'Top 1', render: (p) => p.top1Count },
              { label: 'Top 2', render: (p) => p.top2Count },
              { label: 'Top 3', render: (p) => p.top3Count },
            ]}
          />
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-lg p-3 border border-[var(--border-light)]">
        <strong>Calcul des points :</strong> #1 = 3 pts · #2 = 2 pts · #3 = 1 pt
      </p>
    </div>
  );
}
