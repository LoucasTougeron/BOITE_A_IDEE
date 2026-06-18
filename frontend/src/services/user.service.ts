import api from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  promo?: string;
  specialty?: string;
}

export const userService = {
  getMe(): Promise<Profile> {
    return api.get<Profile>('/users/me').then((r) => r.data);
  },

  updateMe(payload: UpdateProfilePayload): Promise<Profile> {
    return api.put<Profile>('/users/me', payload).then((r) => r.data);
  },

  async changePassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  getAll(): Promise<Profile[]> {
    return api.get<Profile[]>('/users').then((r) => r.data);
  },

  assignTeam(userId: string, teamId: string | null): Promise<void> {
    return api.put(`/users/${userId}/team`, { team_id: teamId }).then(() => undefined);
  },
};
