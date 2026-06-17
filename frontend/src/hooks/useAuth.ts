import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { type SignupPayload, authService } from '../services/auth.service';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchRole() {
    const { data } = await api.get<{ role: string }>('/users/me');
    setIsAdmin(data?.role === 'admin');
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) fetchRole();
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchRole();
      else setIsAdmin(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: { message: error.message } };
    return { error: null };
  };

  const signUp = async (payload: SignupPayload) => {
    try {
      const tokens = await authService.signup(payload);
      await supabase.auth.setSession(tokens);
      return { error: null };
    } catch (err: any) {
      const message = err?.response?.data?.message || "Erreur lors de l'inscription";
      return { error: { message } };
    }
  };

  const signOut = () => supabase.auth.signOut();

  return { user, loading, isAdmin, signIn, signUp, signOut };
}
