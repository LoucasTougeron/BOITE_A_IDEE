import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { dashboardService } from '../services/dashboard.service';
import { teamService, type AutoGenerateResult, type ProposedTeam } from '../services/team.service';
import { topProjectService } from '../services/topProject.service';
import { userService } from '../services/user.service';
import type { AdminVote, Profile, ProjectStat, Team, TeamStats } from '../types';

export interface Stats { byLikes: ProjectStat[]; byTopScore: ProjectStat[] }
export type TeamAssignMode = 'create' | 'existing';
export interface EditableTeam extends ProposedTeam { mode: TeamAssignMode; existingTeamId: string }

const toEditable = (teams: ProposedTeam[]): EditableTeam[] =>
  teams.map((t) => ({ ...t, mode: 'create', existingTeamId: '' }));

export function useDashboard(enabled: boolean) {
  const qc = useQueryClient();

  const { data: votes = [], isLoading: loadingVotes } = useQuery<AdminVote[]>({
    queryKey: ['admin-votes'], queryFn: () => dashboardService.getVotes(), enabled,
  });
  const { data: teams = [], isLoading: loadingTeams } = useQuery<Team[]>({
    queryKey: ['teams'], queryFn: () => teamService.getAll(), enabled,
  });
  const { data: users = [], isLoading: loadingUsers } = useQuery<Profile[]>({
    queryKey: ['users'], queryFn: () => userService.getAll(), enabled,
  });
  const { data: globalStats } = useQuery<Stats>({
    queryKey: ['top-stats'], queryFn: () => topProjectService.getGlobalStats(), enabled,
  });
  const { data: teamStatsList = [] } = useQuery<TeamStats[]>({
    queryKey: ['top-stats-teams'], queryFn: () => topProjectService.getStatsByTeam(), enabled,
  });

  const createTeam = useMutation({
    mutationFn: (name: string) => teamService.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
  const deleteTeam = useMutation({
    mutationFn: (id: string) => teamService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); qc.invalidateQueries({ queryKey: ['users'] }); },
  });
  const assignTeam = useMutation({
    mutationFn: ({ userId, teamId }: { userId: string; teamId: string | null }) => userService.assignTeam(userId, teamId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); qc.invalidateQueries({ queryKey: ['admin-votes'] }); },
  });

  const [teamSize, setTeamSize] = useState(4);
  const [filterPromo, setFilterPromo] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [preview, setPreview] = useState<AutoGenerateResult | null>(null);
  const [editableTeams, setEditableTeams] = useState<EditableTeam[]>([]);

  const autoGenerate = useMutation({
    mutationFn: () => teamService.autoGenerate(teamSize, filterPromo, filterSpecialty),
    onSuccess: (result) => { setPreview(result); setEditableTeams(toEditable(result.teams)); },
  });

  const autoAssign = useMutation({
    mutationFn: () => teamService.autoAssign(
      editableTeams.filter((t) => t.members.length > 0).map((t) =>
        t.mode === 'existing' && t.existingTeamId
          ? { existingTeamId: t.existingTeamId, memberIds: t.members.map((m) => m.id) }
          : { name: t.name, memberIds: t.members.map((m) => m.id) },
      ),
    ),
    onSuccess: () => {
      setPreview(null); setEditableTeams([]);
      qc.invalidateQueries({ queryKey: ['teams'] }); qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateTeam = (i: number, patch: Partial<EditableTeam>) =>
    setEditableTeams((prev) => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));

  const removeMember = (teamIdx: number, memberId: string) =>
    setEditableTeams((prev) => prev.map((t, i) =>
      i === teamIdx ? { ...t, members: t.members.filter((m) => m.id !== memberId) } : t,
    ));

  const resetPreview = () => { setPreview(null); setEditableTeams([]); };

  const changePromo = (v: string) => { setFilterPromo(v); setFilterSpecialty(''); };

  return {
    votes, loadingVotes,
    teams, loadingTeams,
    users, loadingUsers,
    globalStats, teamStatsList,
    createTeam, deleteTeam, assignTeam,
    teamSize, setTeamSize,
    filterPromo, setFilterPromo: changePromo,
    filterSpecialty, setFilterSpecialty,
    preview, editableTeams,
    autoGenerate, autoAssign,
    updateTeam, removeMember, resetPreview,
  };
}
