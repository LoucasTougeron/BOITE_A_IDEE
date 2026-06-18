import { supabase } from '../lib/supabase';
import api from '../lib/api';
import type { Profile } from '../types';

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

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  if (typeof msg === 'string') return msg;
  return 'Une erreur est survenue';
}

export const authService = {
  // signIn goes through Supabase SDK — it manages token storage and refresh automatically
  async signIn(email: string, password: string): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { message: error.message };
    return null;
  },

  // signUp goes through the API for backend validation (DTO, email rules, etc.)
  // then sets the Supabase session from the returned tokens
  async signUp(payload: SignupPayload): Promise<AuthError | null> {
    try {
      const { data } = await api.post<{
        access_token: string;
        refresh_token: string;
        user: Profile;
      }>('/auth/signup', payload);

      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      return null;
    } catch (err) {
      return { message: extractMessage(err) };
    }
  },

  // signOut goes through Supabase SDK — cleans up the local session
  async signOut(): Promise<AuthError | null> {
    const { error } = await supabase.auth.signOut();
    if (error) return { message: error.message };
    return null;
  },
};
