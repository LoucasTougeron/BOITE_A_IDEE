import { Lightbulb, Sparkles, TrendingUp, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const features = [
  { icon: Sparkles, label: 'Déposez vos idées', desc: 'Partagez vos projets en quelques minutes' },
  { icon: TrendingUp, label: 'Votez et classez', desc: 'Les meilleures idées remontent naturellement' },
  { icon: Users, label: 'Trouvez votre équipe', desc: 'Connectez-vous avec des profils complémentaires' },
];

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
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
    <div className="min-h-[calc(100vh-56px)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-indigo-700 text-white p-12">
        <div>
          <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-12">
            <Lightbulb size={16} /> Sup de Vinci
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            La Boîte à Idées<br />de votre école
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed">
            Centralisez, explorez et votez pour les projets étudiants les plus innovants.
          </p>
        </div>
        <div className="space-y-6">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                <Icon size={16} />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-indigo-300 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-indigo-400 text-xs">© 2025 BAD — Boîte à Idées</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {isRegister ? 'Créer un compte' : 'Bon retour !'}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {isRegister
              ? 'Rejoignez la communauté et partagez vos idées'
              : 'Connectez-vous pour accéder à la plateforme'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
              <input
                type="email"
                placeholder="prenom.nom@supdevinci.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3.5 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm mt-2"
            >
              {loading ? 'Chargement...' : isRegister ? "Créer mon compte" : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">
              {isRegister ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
            </span>
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              {isRegister ? 'Se connecter' : "S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
