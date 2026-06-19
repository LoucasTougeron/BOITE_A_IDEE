import { useMutation, useQuery } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AlertMessage from '../components/ui/AlertMessage';
import BackButton from '../components/ui/BackButton';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import InputField from '../components/ui/InputField';
import SelectField from '../components/ui/SelectField';
import TextareaField from '../components/ui/TextareaField';
import { useAuth } from '../hooks/useAuth';
import { projectService, type ProjectPayload } from '../services/project.service';
import { storageService } from '../services/storage.service';

const THEMES = ['Tech', 'Design', 'Business', 'Social', 'Science', 'Art'];
const STATUSES = [
  { value: 'idea', label: 'Idée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
];

interface FormState {
  title: string;
  description: string;
  objective: string;
  theme: string;
  tags: string;
  link: string;
  team_name: string;
  specialty: string;
  status: string;
  file_url: string;
}

const DEFAULT_FORM: FormState = {
  title: '', description: '', objective: '', theme: THEMES[0],
  tags: '', link: '', team_name: '', specialty: '', status: 'idea', file_url: '',
};

export default function ProjectFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: existing, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!isEdit || !existing || isLoadingProject) return;
    const isOwner = existing.creator_id === profile?.id;
    if (!isOwner && !isAdmin) {
      navigate(`/projects/${id}`, { replace: true });
    }
  }, [existing, isLoadingProject, profile, isAdmin, isEdit, id, navigate]);

  useEffect(() => {
    if (existing) {
      setForm({ ...existing, tags: existing.tags?.join(', ') ?? '' });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (payload: ProjectPayload) =>
      isEdit ? projectService.update(id!, payload) : projectService.create(payload),
    onSuccess: (project) => navigate(`/projects/${project.id}`),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setUploadError('');
    setSubmitted(true);

    if (!form.title || !form.description || !form.objective) return;

    let fileUrl = form.file_url || undefined;

    if (file) {
      setUploading(true);
      try {
        fileUrl = await storageService.uploadProjectFile(file);
      } catch {
        setUploadError("Erreur lors de l'upload du fichier. Réessayez.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Only send optional fields if they have a value — avoid sending empty strings
    const payload: ProjectPayload = {
      title: form.title,
      description: form.description,
      objective: form.objective,
      theme: form.theme,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: form.status,
      ...(form.link && { link: form.link }),
      ...(fileUrl && { file_url: fileUrl }),
      ...(form.team_name && { team_name: form.team_name }),
      ...(form.specialty && { specialty: form.specialty }),
    };

    mutation.mutate(payload);
  }

  const set = (field: keyof FormState) => (value: string) =>
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
            <div className="md:col-span-2 space-y-4 sm:space-y-5">
              <Card title="Information sur le projet">
                <div className="space-y-4">
                  <InputField
                    label="Titre"
                    placeholder="Un titre clair et accrocheur"
                    value={form.title}
                    onChange={set('title')}
                    required
                    error={submitted && !form.title}
                  />
                  <TextareaField
                    label="Description"
                    placeholder="Décrivez votre projet en quelques phrases..."
                    value={form.description}
                    onChange={set('description')}
                    rows={3}
                    required
                    error={submitted && !form.description}
                  />
                  <TextareaField
                    label="Objectif"
                    placeholder="Quel problème résout ce projet ?"
                    value={form.objective}
                    onChange={set('objective')}
                    rows={3}
                    required
                    error={submitted && !form.objective}
                  />
                </div>
              </Card>

              <Card title="Classification">
                <div className="space-y-4">
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
              </Card>
            </div>

            <div className="space-y-4">
              <Card title="Informations">
                <div className="space-y-4">
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
              </Card>

              {(uploadError || mutation.isError) && (
                <AlertMessage type="error">
                  {uploadError || 'Une erreur est survenue. Vérifiez les champs.'}
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
