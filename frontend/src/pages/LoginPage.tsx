import { Lightbulb, Sparkles, TrendingUp, Users } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAnimateOnMount, useStaggerAnimation } from '../hooks/useAnimations';

const features = [
  { icon: Sparkles, label: 'Déposez vos idées', desc: 'Partagez vos projets en quelques minutes' },
  { icon: TrendingUp, label: 'Votez et classez', desc: 'Les meilleures idées remontent naturellement' },
  { icon: Users, label: 'Trouvez votre équipe', desc: 'Connectez-vous avec des profils complémentaires' },
];

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  useAnimateOnMount(leftRef, { type: 'slideRight', duration: 0.7 });
  useAnimateOnMount(formRef, { type: 'fadeUp', delay: 0.2, duration: 0.6 });
  useStaggerAnimation(featuresRef, '> div', { type: 'fadeUp', stagger: 0.12, delay: 0.3, duration: 0.5 });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = isRegister
      ? await signUp(email, password)
      : await signIn(email, password);
    setLoading(false);
    if (error) return setError(error.message);
    navigate('/');
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex page-enter">
      {/* Left panel - Brand */}
      <div ref={leftRef} className="hidden lg:flex flex-col justify-between w-[520px] shrink-0 relative overflow-hidden p-12">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-16">
            <Lightbulb size={16} /> Sup de Vinci
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-4 text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
            La Boîte à Idées<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">de votre école</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            Centralisez, explorez et votez pour les projets étudiants les plus innovants.
          </p>
        </div>

        <div ref={featuresRef} className="relative z-10 space-y-5">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                <Icon size={16} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{label}</p>
                <p className="text-white/60 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-white/40 text-xs">© 2025 BAD — Boîte à Idées</p>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div ref={formRef} className="w-full max-w-sm glass-card p-8">
          <div className="mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
              <Lightbulb size={18} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {isRegister ? 'Créer un compte' : 'Bon retour !'}
            </h2>
            <p className="text-[var(--text-muted)] text-sm">
              {isRegister
                ? 'Rejoignez la communauté et partagez vos idées'
                : 'Connectez-vous pour accéder à la plateforme'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Adresse email</label>
              <input
                type="email"
                placeholder="prenom.nom@supdevinci.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-modern"
              />
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full flex items-center justify-center text-sm py-2.5 mt-2"
            >
              {loading ? 'Chargement...' : isRegister ? "Créer mon compte" : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-[var(--text-muted)]">
              {isRegister ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
            </span>
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-80 transition-opacity"
            >
              {isRegister ? 'Se connecter' : "S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}