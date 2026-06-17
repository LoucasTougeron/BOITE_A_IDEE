import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertMessage from '../components/ui/AlertMessage';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import SelectField from '../components/ui/SelectField';
import { PROMOS, SPECIALTIES } from '../constants/promos';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/user.service';
import type { Profile } from '../types';

export default function ProfilePage() {
  const { user, profile: authProfile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
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
    setProfile(authProfile);
  }, [user, authLoading, authProfile, navigate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await userService.updateMe({
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        promo: profile?.promo,
        specialty: profile?.specialty,
      });
      await refreshProfile();
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
      await userService.changePassword(passwordForm.newPassword);
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors du changement de mot de passe.';
      setMessage({ type: 'error', text: message });
    } finally {
      setPasswordLoading(false);
    }
  }

  if (authLoading) {
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
        <div className="mb-6">
          <AlertMessage type={message.type}>{message.text}</AlertMessage>
        </div>
      )}

      <div className="glass-card-static p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Informations personnelles</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Prénom"
              value={profile?.first_name || ''}
              onChange={(v) => setProfile((prev) => (prev ? { ...prev, first_name: v } : prev))}
            />
            <InputField
              label="Nom"
              value={profile?.last_name || ''}
              onChange={(v) => setProfile((prev) => (prev ? { ...prev, last_name: v } : prev))}
            />
          </div>
          <InputField label="Email" type="email" value={profile?.email || ''} onChange={() => {}} disabled />
          <SelectField
            label="Promo"
            value={profile?.promo || ''}
            onChange={(v) => setProfile((prev) => (prev ? { ...prev, promo: v, specialty: '' } : prev))}
            options={PROMOS.map((p) => ({ value: p, label: p }))}
            placeholder="Sélectionner une promo"
          />
          {SPECIALTIES[profile?.promo || ''] && (
            <SelectField
              label="Spécialité"
              value={profile?.specialty || ''}
              onChange={(v) => setProfile((prev) => (prev ? { ...prev, specialty: v } : prev))}
              options={SPECIALTIES[profile?.promo || ''].map((s) => ({ value: s, label: s }))}
              placeholder="Sélectionner une spécialité"
            />
          )}
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </div>

      <div className="glass-card-static p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Modifier le mot de passe</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <InputField
            label="Nouveau mot de passe"
            type="password"
            placeholder="Au moins 6 caractères"
            value={passwordForm.newPassword}
            onChange={(v) => setPasswordForm((prev) => ({ ...prev, newPassword: v }))}
            required
          />
          <InputField
            label="Confirmer le mot de passe"
            type="password"
            placeholder="Retaper le mot de passe"
            value={passwordForm.confirmPassword}
            onChange={(v) => setPasswordForm((prev) => ({ ...prev, confirmPassword: v }))}
            required
          />
          <Button type="submit" disabled={passwordLoading}>
            {passwordLoading ? 'Modification...' : 'Changer le mot de passe'}
          </Button>
        </form>
      </div>
    </div>
  );
}
