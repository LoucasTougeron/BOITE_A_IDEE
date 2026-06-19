import { LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import VotesTab from '../components/dashboard/VotesTab';
import RankingsTab from '../components/dashboard/RankingsTab';
import TeamsTab from '../components/dashboard/TeamsTab';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';

type Tab = 'votes' | 'rankings' | 'teams';

const TABS: { key: Tab; label: string }[] = [
  { key: 'votes',    label: 'Votes des étudiants' },
  { key: 'rankings', label: 'Classements' },
  { key: 'teams',    label: 'Gestion des équipes' },
];

export default function DashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('votes');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const d = useDashboard(!!isAdmin);

  if (loading) return <LoadingState fullPage />;
  if (!user)   return <Navigate to="/login" replace />;

  return (
    <div className="min-h-[calc(100vh-56px)] page-enter">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          icon={<LayoutDashboard size={24} className="text-[var(--accent-2)]" />}
          title="Dashboard"
          description="Gestion des votes, classements et équipes étudiantes."
        />

        {/* Onglets */}
        <div className="flex gap-4 mb-8 border-b border-[var(--border-light)] pb-2">
          {isAdmin ? TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${
                activeTab === key
                  ? 'text-[var(--text-primary)] border-purple-500'
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'
              }`}
            >
              {label}
            </button>
          )) : (
            <p className="text-sm text-[var(--text-muted)] py-2">Accès réservé à la pédagogie</p>
          )}
        </div>

        {/* Contenu */}
        {isAdmin && activeTab === 'votes' && (
          <VotesTab votes={d.votes} loading={d.loadingVotes} />
        )}

        {isAdmin && activeTab === 'rankings' && (
          <RankingsTab
            teams={d.teams}
            globalStats={d.globalStats}
            teamStatsList={d.teamStatsList}
            selectedTeamId={selectedTeamId}
            onSelectTeam={setSelectedTeamId}
          />
        )}

        {isAdmin && activeTab === 'teams' && (
          <TeamsTab dashboard={d} />
        )}
      </div>
    </div>
  );
}
