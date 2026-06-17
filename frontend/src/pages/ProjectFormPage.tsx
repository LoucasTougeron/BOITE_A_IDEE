import { useMutation, useQuery } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AlertMessage from '../components/ui/AlertMessage';
import BackButton from '../components/ui/BackButton';
import Button from '../components/ui/Button';
import InputField from '../components/ui/InputField';
import SelectField from '../components/ui/SelectField';
import TextareaField from '../components/ui/TextareaField';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

const THEMES = ['Tech', 'Design', 'Business', 'Social', 'Science', 'Art'];
const STATUSES = [
  { value: 'idea', label: 'Idée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
];

export default function ProjectFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '', description: '', objective: '', theme: THEMES[0],
    tags: '', link: '', team_name: '', specialty: '', status: 'idea', file_url: '',
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
        alert("Erreur lors de l'upload du fichier");
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

  const set = (field: string) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-[calc(100vh-56px)] page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <BackButton onClick={() => navigate(-1)} />

        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {isEdit ? 'Modifier le projet' : 'Déposer un projet'}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {isEdit ? 'Mettez à jour les informations de votre projet.' : 'Remplissez les informations pour soumettre votre idée.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-start">
            {/* Main */}
            <div className="md:col-span-2 space-y-4 sm:space-y-5">
              <div className="glass-card-static p-4 sm:p-6 space-y-4 sm:space-y-5">
                <InputField
                  label="Titre"
                  placeholder="Un titre clair et accrocheur"
                  value={form.title}
                  onChange={set('title')}
                  required
                />
                <TextareaField
                  label="Description"
                  placeholder="Décrivez votre projet en quelques phrases..."
                  value={form.description}
                  onChange={set('description')}
                  rows={3}
                  required
                />
                <TextareaField
                  label="Objectif"
                  placeholder="Quel problème résout ce projet ?"
                  value={form.objective}
                  onChange={set('objective')}
                  rows={3}
                  required
                />
              </div>

              <div className="glass-card-static p-4 sm:p-6 space-y-4 sm:space-y-5">
                <h2 className="font-semibold text-[var(--text-primary)] text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                  Classification
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Thématique"
                    required
                    value={form.theme}
                    options={THEMES.map((t) => ({ value: t, label: t }))}
                    onChange={(v) => setForm((f) => ({ ...f, theme: v }))}
                  />
                  <InputField
                    label="Spécialité"
                    placeholder="ex: Data, Cybersécurité..."
                    value={form.specialty}
                    onChange={set('specialty')}
                  />
                </div>
                <InputField
                  label="Tags"
                  hint="(séparés par des virgules)"
                  placeholder="ex: IA, web, blockchain, data"
                  value={form.tags}
                  onChange={set('tags')}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="glass-card-static p-4 sm:p-5 space-y-4">
                <h2 className="font-semibold text-[var(--text-primary)] text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                  Informations
                </h2>
                <SelectField
                  label="Statut"
                  value={form.status}
                  options={STATUSES}
                  onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                />
                <InputField
                  label="Nom de l'équipe"
                  placeholder="ex: Team Alpha"
                  value={form.team_name}
                  onChange={set('team_name')}
                />
                <InputField
                  label="Lien livrable"
                  type="url"
                  placeholder="https://..."
                  value={form.link}
                  onChange={set('link')}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] tracking-wide uppercase">
                    Fichier PDF <span className="font-normal text-[var(--text-muted)] normal-case">(Optionnel)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-[var(--text-muted)] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500/10 file:to-pink-500/10 file:text-[var(--accent-2)] hover:file:from-purple-500/20 hover:file:to-pink-500/20 transition file:transition-colors file:cursor-pointer"
                  />
                  {form.file_url && !file && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Un fichier est déjà joint.{' '}
                      <a href={form.file_url} target="_blank" rel="noreferrer" className="font-semibold gradient-text hover:opacity-80 transition-opacity">
                        Voir le fichier
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {mutation.isError && (
                <AlertMessage type="error">
                  Une erreur est survenue. Vérifiez les champs.
                </AlertMessage>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending || uploading}
                fullWidth
              >
                {uploading ? 'Upload du fichier...' : mutation.isPending ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Déposer le projet'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => navigate(-1)}
                fullWidth
              >
                Annuler
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
