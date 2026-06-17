import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

const THEMES = ['Tech', 'Design', 'Business', 'Social', 'Science', 'Art'];
const STATUSES = ['idea', 'in_progress', 'completed'];

export default function ProjectFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '', description: '', objective: '', theme: THEMES[0],
    tags: '', link: '', team_name: '', specialty: '', status: STATUSES[0], file_url: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({ ...existing, tags: existing.tags?.join(', ') ?? '' });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? api.put(`/projects/${id}`, data) : api.post('/projects', data),
    onSuccess: (res) => navigate(`/projects/${res.data.id}`),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let fileUrl = form.file_url;

    if (file) {
      setUploading(true);
      const fileExt = file.name.split('.').pop() || 'pdf';
      const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const safeName = originalName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${Date.now()}-${safeName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project_files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error', uploadError);
        alert('Erreur lors de l\'upload du fichier');
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('project_files').getPublicUrl(fileName);
      fileUrl = data.publicUrl;
      setUploading(false);
    }

    mutation.mutate({
      ...form,
      file_url: fileUrl,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-[calc(100vh-56px)] page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <button onClick={() => navigate(-1)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 mb-3 sm:mb-4 transition-colors group">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Retour
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{isEdit ? 'Modifier le projet' : 'Déposer un projet'}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {isEdit ? 'Mettez à jour les informations de votre projet.' : 'Remplissez les informations pour soumettre votre idée.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-start">
            {/* Main */}
            <div className="md:col-span-2 space-y-4 sm:space-y-5">
              <div className="glass-card-static p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Titre *</label>
                  <input value={form.title} onChange={set('title')} required placeholder="Un titre clair et accrocheur" className="input-modern" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Description *</label>
                  <textarea value={form.description} onChange={set('description')} required rows={4} placeholder="Décrivez votre projet en quelques phrases..." className="input-modern resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Objectif *</label>
                  <textarea value={form.objective} onChange={set('objective')} required rows={3} placeholder="Quel problème résout ce projet ?" className="input-modern resize-none" />
                </div>
              </div>

              <div className="glass-card-static p-4 sm:p-6 space-y-4 sm:space-y-5">
                <h2 className="font-semibold text-[var(--text-primary)] text-sm" style={{ fontFamily: 'var(--font-display)' }}>Classification</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Thématique *</label>
                    <select value={form.theme} onChange={set('theme')} className="input-modern">
                      {THEMES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Spécialité</label>
                    <input value={form.specialty} onChange={set('specialty')} placeholder="ex: Data, Cybersécurité..." className="input-modern" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Tags <span className="font-normal text-[var(--text-muted)]">(séparés par des virgules)</span></label>
                  <input value={form.tags} onChange={set('tags')} placeholder="ex: IA, web, blockchain, data" className="input-modern" />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="glass-card-static p-4 sm:p-5 space-y-4">
                <h2 className="font-semibold text-[var(--text-primary)] text-sm" style={{ fontFamily: 'var(--font-display)' }}>Informations</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Statut</label>
                    <select value={form.status} onChange={set('status')} className="input-modern">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Nom de l'équipe</label>
                    <input value={form.team_name} onChange={set('team_name')} placeholder="ex: Team Alpha" className="input-modern" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Lien livrable</label>
                  <input value={form.link} onChange={set('link')} type="url" placeholder="https://..." className="input-modern" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wide uppercase">Fichier PDF (Optionnel)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-[var(--text-muted)] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500/10 file:to-pink-500/10 file:text-[var(--accent-2)] hover:file:from-purple-500/20 hover:file:to-pink-500/20 transition file:transition-colors file:cursor-pointer"
                  />
                  {form.file_url && !file && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Un fichier est déjà joint. <a href={form.file_url} target="_blank" rel="noreferrer" className="font-semibold gradient-text hover:opacity-80 transition-opacity">Voir le fichier</a>
                    </p>
                  )}
                </div>
              </div>

              {mutation.isError && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-600 text-sm px-4 py-3 rounded-xl">
                  Une erreur est survenue. Vérifiez les champs.
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || uploading}
                className="btn-accent w-full flex items-center justify-center text-sm py-3"
              >
                {uploading ? 'Upload du fichier...' : mutation.isPending ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Déposer le projet'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] py-2.5 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}