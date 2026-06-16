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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-56px)]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 mb-4 transition-colors">
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Modifier le projet' : 'Déposer un projet'}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEdit ? 'Mettez à jour les informations de votre projet.' : 'Remplissez les informations pour soumettre votre idée.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-6 items-start">
            {/* Main */}
            <div className="col-span-2 space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div>
                  <label className={labelCls}>Titre *</label>
                  <input value={form.title} onChange={set('title')} required placeholder="Un titre clair et accrocheur" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Description *</label>
                  <textarea value={form.description} onChange={set('description')} required rows={4} placeholder="Décrivez votre projet en quelques phrases..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Objectif *</label>
                  <textarea value={form.objective} onChange={set('objective')} required rows={3} placeholder="Quel problème résout ce projet ?" className={inputCls} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <h2 className="font-semibold text-gray-900 text-sm">Classification</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Thématique *</label>
                    <select value={form.theme} onChange={set('theme')} className={inputCls}>
                      {THEMES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Spécialité</label>
                    <input value={form.specialty} onChange={set('specialty')} placeholder="ex: Data, Cybersécurité..." className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tags <span className="text-gray-400 font-normal">(séparés par des virgules)</span></label>
                  <input value={form.tags} onChange={set('tags')} placeholder="ex: IA, web, blockchain, data" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h2 className="font-semibold text-gray-900 text-sm">Informations</h2>
                <div>
                  <label className={labelCls}>Statut</label>
                  <select value={form.status} onChange={set('status')} className={inputCls}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nom de l'équipe</label>
                  <input value={form.team_name} onChange={set('team_name')} placeholder="ex: Team Alpha" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Lien livrable</label>
                  <input value={form.link} onChange={set('link')} type="url" placeholder="https://..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fichier PDF (Optionnel)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
                  />
                  {form.file_url && !file && (
                    <p className="mt-2 text-xs text-gray-500">
                      Un fichier est déjà joint. <a href={form.file_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Voir le fichier</a>
                    </p>
                  )}
                </div>
              </div>

              {mutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  Une erreur est survenue. Vérifiez les champs.
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {uploading ? 'Upload du fichier...' : mutation.isPending ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Déposer le projet'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
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
