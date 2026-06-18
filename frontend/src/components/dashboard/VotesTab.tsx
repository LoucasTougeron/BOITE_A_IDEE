import LoadingState from '../ui/LoadingState';
import type { AdminVote } from '../../types';

interface Props { votes: AdminVote[]; loading: boolean }

export default function VotesTab({ votes, loading }: Props) {
  return (
    <div className="glass-card-static rounded-xl overflow-hidden shadow-sm">
      {loading ? <LoadingState text="Chargement des votes..." /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
              <tr>
                {['Étudiant', 'Équipe', 'Projet voté', 'Thème', 'Date'].map((h) => (
                  <th key={h} className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {votes.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">Aucun vote enregistré.</td></tr>
              ) : votes.map((v) => (
                <tr key={v.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--text-primary)]">{v.users.first_name} {v.users.last_name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{v.users.email}</div>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{v.users.teams?.name || '—'}</td>
                  <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{v.projects.title}</td>
                  <td className="px-6 py-4">
                    <span className={`theme-badge theme-badge-${v.projects.theme.toLowerCase()}`}>{v.projects.theme}</span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-muted)]">
                    {new Date(v.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
