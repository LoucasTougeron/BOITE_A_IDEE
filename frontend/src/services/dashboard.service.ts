import api from '../lib/api';
import type { AdminVote } from '../types';

export const dashboardService = {
  getVotes(): Promise<AdminVote[]> {
    return api.get<AdminVote[]>('/votes').then((r) => r.data);
  },
};
