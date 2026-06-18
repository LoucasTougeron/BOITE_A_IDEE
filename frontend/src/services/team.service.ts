import api from '../lib/api';
import type { Team } from '../types';

export const teamService = {
  getAll(): Promise<Team[]> {
    return api.get<Team[]>('/teams').then((r) => r.data);
  },

  create(name: string): Promise<Team> {
    return api.post<Team>('/teams', { name }).then((r) => r.data);
  },
};
