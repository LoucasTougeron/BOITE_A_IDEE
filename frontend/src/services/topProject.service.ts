import api from '../lib/api';
import type { ProjectStat, TeamStats, UserTopProject } from '../types';

export interface RankingEntry {
  project_id: string;
  rank: number;
}

export const topProjectService = {
  getMy(): Promise<UserTopProject[]> {
    return api.get<UserTopProject[]>('/user-top-projects/me').then((r) => r.data);
  },

  saveMy(rankings: RankingEntry[]): Promise<void> {
    return api.post('/user-top-projects/me', { rankings }).then(() => undefined);
  },

  getGlobalStats(): Promise<{ byLikes: ProjectStat[]; byTopScore: ProjectStat[] }> {
    return api.get('/user-top-projects/stats').then((r) => r.data);
  },

  getStatsByTeam(): Promise<TeamStats[]> {
    return api.get<TeamStats[]>('/user-top-projects/stats/teams').then((r) => r.data);
  },
};
