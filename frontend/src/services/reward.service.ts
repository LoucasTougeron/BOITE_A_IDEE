import api from '../lib/api';
import type { RewardData } from '../types';

export const rewardService = {
  getMy(): Promise<RewardData> {
    return api.get<RewardData>('/rewards/me').then((r) => r.data);
  },

  participate(): Promise<{ participation: { status: string; prize: string } }> {
    return api
      .post<{ participation: { status: string; prize: string } }>('/rewards/participate')
      .then((r) => r.data);
  },
};
