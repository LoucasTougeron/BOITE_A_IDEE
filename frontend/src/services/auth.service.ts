import { supabase } from '../lib/supabase';
import api from '../lib/api';

export interface SignupPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  promo: string;
  specialty?: string;
}

export interface AuthError {
  message: string;
}

interface SessionTokens {
  access_token: string;
  refresh_token: string;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const apiError = err as { response?: { data?: { message?: string } } };
    if (apiError.response?.data?.message) return apiError.response.data.message;
  }
  return 'Une erreur est survenue';
}

export const authService = {
  async signIn(email: string, password: string): Promise<AuthError | null> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: unknown) {
      return { message: getErrorMessage(err) };
    }
    return null;
  },

  async signUp(payload: SignupPayload): Promise<AuthError | null> {
    try {
      const tokens = await api.post<SessionTokens>('/auth/signup', payload).then(r => r.data);
      await supabase.auth.setSession(tokens);
      return null;
    } catch (err: unknown) {
      return { message: getErrorMessage(err) };
    }
  },

  async signOut(): Promise<AuthError | null> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err: unknown) {
      return { message: getErrorMessage(err) };
    }
    return null;
  },
};
