import api from '../lib/api';

export interface SignupPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  promo: string;
  specialty?: string;
}

interface SessionTokens {
  access_token: string;
  refresh_token: string;
}

export const authService = {
  async signup(payload: SignupPayload): Promise<SessionTokens> {
    const { data } = await api.post<SessionTokens>('/auth/signup', payload);
    return data;
  },
};
