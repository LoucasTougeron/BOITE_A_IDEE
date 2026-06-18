import api from '../lib/api';
import type { Team } from '../types';

export interface ProposedTeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  promo?: string;
  specialty?: string;
  affinityScore: number;
}

export interface ProposedTeam {
  name: string;
  members: ProposedTeamMember[];
}

export interface AutoGenerateResult {
  teams: ProposedTeam[];
  unassigned: Omit<ProposedTeamMember, 'affinityScore'>[];
  stats: {
    totalStudents: number;
    studentsWithPreferences: number;
    studentsWithoutPreferences: number;
    mode: 'affinity' | 'balanced';
  };
}

export const teamService = {
  getAll(): Promise<Team[]> {
    return api.get<Team[]>('/teams').then((r) => r.data);
  },

  create(name: string): Promise<Team> {
    return api.post<Team>('/teams', { name }).then((r) => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/teams/${id}`).then(() => undefined);
  },

  autoGenerate(teamSize: number, filterPromo?: string, filterSpecialty?: string): Promise<AutoGenerateResult> {
    return api.post<AutoGenerateResult>('/teams/auto-generate', {
      teamSize,
      filterPromo: filterPromo || undefined,
      filterSpecialty: filterSpecialty || undefined,
    }).then((r) => r.data);
  },

  autoAssign(teams: ({ name: string; existingTeamId?: never } | { existingTeamId: string; name?: never } & { memberIds: string[] })[]): Promise<void> {
    return api.post('/teams/auto-assign', { teams }).then(() => undefined);
  },
};
