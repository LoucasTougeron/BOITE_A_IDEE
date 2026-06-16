import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Profile } from '../types';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    api.get('/users/me').then((res) => {
      setProfile(res.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [user, authLoading, navigate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/users/me', {
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        specialty: profile?.specialty,
      });
      setProfile(res.data);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors du changement de mot de passe.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  if (authLoading || loading) {
    return <div className="p-8 text-center text-[var(--text-muted)]">Chargement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
          {user?.email?.[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Mon Profil</h1>
          <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm border backdrop-blur-sm ${
            message.type === 'success'
              ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50'
              : 'bg-red-50/80 text-red-700 border-red-200/50'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <div className="glass-card-static p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Informations personnelles</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Prénom</label>
              <input
                type="text"
                value={profile?.first_name || ''}
                onChange={(e) => setProfile((prev) => (prev ? { ...prev, first_name: e.target.value } : prev))}
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Nom</label>
              <input
                type="text"
                value={profile?.last_name || ''}
                onChange={(e) => setProfile((prev) => (prev ? { ...prev, last_name: e.target.value } : prev))}
                className="input-modern"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="input-modern"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Spécialité</label>
            <input
              type="text"
              value={profile?.specialty || ''}
              onChange={(e) => setProfile((prev) => (prev ? { ...prev, specialty: e.target.value } : prev))}
              className="input-modern"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-accent"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="glass-card-static p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Modifier le mot de passe</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Nouveau mot de passe</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              className="input-modern"
              required
              minLength={6}
              placeholder="Au moins 6 caractères"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Confirmer le mot de passe</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className="input-modern"
              required
              minLength={6}
              placeholder="Retaper le mot de passe"
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="btn-accent"
            style={{ background: 'linear-gradient(135deg, #1a0a3e, #2d1b69)' }}
          >
            {passwordLoading ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}