import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { type SignupPayload, authService } from '../services/auth.service';
import type { Profile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  async function fetchProfile() {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data } = await api.get<Profile>('/users/me');
      setProfile(data);
      setIsAdmin(data?.role === 'admin');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile();
      else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
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

  return { user, profile, setProfile, loading, isAdmin, signIn, signUp, signOut };
}
