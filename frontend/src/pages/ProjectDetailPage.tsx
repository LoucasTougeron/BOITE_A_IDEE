import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Download, ExternalLink, FileText, Heart, Pencil, Tag, Trash2, Users, ThumbsDown } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/ui/BackButton';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import type { Project } from '../types';

const STATUS_LABEL: Record<string, string> = {
  idea: 'Idée',
  in_progress: 'En cours',
  completed: 'Terminé',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
  });

  const { data: hasVoted = false } = useQuery<boolean>({
    queryKey: ['vote', id, user?.id],
    queryFn: () => api.get(`/projects/${id}/votes/me`).then((r) => r.data.voted),
    enabled: !!user,
  });

  const { data: hasDisliked = false } = useQuery<boolean>({
    queryKey: ['dislike', id, user?.id],
    queryFn: () => api.get(`/projects/${id}/dislikes/me`).then((r) => r.data.disliked),
    enabled: !!user,
  });

  const voteMutation = useMutation({
    mutationFn: () => hasVoted
      ? api.delete(`/projects/${id}/votes`)
      : api.post(`/projects/${id}/votes`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['vote', id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dislike', id, user?.id] });
    },
  });

  const dislikeMutation = useMutation({
    mutationFn: () => hasDisliked
      ? api.delete(`/projects/${id}/dislikes`)
      : api.post(`/projects/${id}/dislikes`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['vote', id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dislike', id, user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => navigate('/'),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 page-enter">
        <div className="h-8 w-24 shimmer rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 shimmer rounded-xl" />
          </div>
          <div className="h-64 shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center page-enter">
        <p className="text-[var(--text-muted)]">Projet introuvable.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm font-semibold gradient-text hover:opacity-80 transition-opacity">Retour à l'accueil</button>
      </div>
    );
  }

  const voteCount = project.votes?.[0]?.count ?? 0;
  const dislikeCount = project.dislikes?.[0]?.count ?? 0;
  const canEdit = user?.id === project.creator_id || isAdmin;
  const date = new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-[calc(100vh-56px)] page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <BackButton onClick={() => navigate(-1)} label="Retour aux projets" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card-static p-4 sm:p-7">
              <div className="flex items-center gap-2 mb-4 sm:mb-5 flex-wrap">
                <span className={`theme-badge theme-badge-${project.theme.toLowerCase()}`}>{project.theme}</span>
                <span className={`badge badge-${project.status}`}>
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>{project.title}</h1>
              {project.team_name && (
                <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5 mb-5 sm:mb-6">
                  <Users size={13} /> {project.team_name}
                </p>
              )}

              <div className="space-y-5 sm:space-y-6">
                <div>
                  <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Description</h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-sm sm:text-base">{project.description}</p>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Objectif</h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-sm sm:text-base">{project.objective}</p>
                </div>
              </div>

              {project.tags?.length > 0 && (
                <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-[var(--border-light)] flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {project.file_url && (
                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[var(--border-light)]">
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} /> Document Joint
                    </h2>
                    <div className="flex items-center gap-4">
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const urlParts = project.file_url.split('/');
                            const rawFileName = urlParts[urlParts.length - 1].split('?')[0];

                            let displayFileName = `${project.title || 'document'}.pdf`;
                            if (rawFileName.includes('-')) {
                              const parts = rawFileName.split('-');
                              parts.shift();
                              displayFileName = parts.join('-');
                            }

                            const { supabase } = await import('../lib/supabase');
                            const { data: blob, error } = await supabase.storage.from('project_files').download(rawFileName);

                            if (error) throw error;
                            if (!blob) throw new Error("No blob returned");

                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = displayFileName;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error('Download failed', err);
                            window.open(`${project.file_url}?download=${encodeURIComponent(project.title || 'document')}.pdf`, '_blank');
                          }
                        }}
                        className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-80 transition-opacity flex items-center gap-1"
                      >
                        <Download size={14} className="text-purple-600" /> Télécharger
                      </a>
                      <a
                        href={project.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                      >
                        <ExternalLink size={14} /> Nouvel onglet
                      </a>
                    </div>
                  </div>
                  <div className="w-full h-[50vh] sm:h-[600px] rounded-xl overflow-hidden border border-[var(--border-light)] bg-white/50">
                    <iframe
                      src={`${project.file_url}#toolbar=0`}
                      className="w-full h-full"
                      title="Document PDF du projet"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — on mobile, shown below main content */}
          <div className="space-y-4">
            {/* Vote */}
            <div className="glass-card-static p-5">
              <div className="flex gap-2">
                <button
                  onClick={() => user ? voteMutation.mutate() : navigate('/login')}
                  disabled={voteMutation.isPending || dislikeMutation.isPending}
                  className={`flex-1 flex items-center justify-center gap-1.5 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm ${
                    hasVoted
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-gradient-to-r from-pink-500/10 to-rose-500/10 text-pink-600 border border-pink-500/20 hover:from-pink-500/20 hover:to-rose-500/20'
                  }`}
                >
                  <Heart size={15} fill={hasVoted ? 'currentColor' : 'none'} />
                  {voteCount} Like{voteCount > 1 ? 's' : ''}
                </button>

                <button
                  onClick={() => user ? dislikeMutation.mutate() : navigate('/login')}
                  disabled={voteMutation.isPending || dislikeMutation.isPending}
                  className={`flex-1 flex items-center justify-center gap-1.5 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm ${
                    hasDisliked
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-600/25'
                      : 'bg-gradient-to-r from-gray-500/10 to-gray-600/10 text-gray-600 border border-gray-500/20 hover:from-gray-500/20 hover:to-gray-600/20'
                  }`}
                >
                  <ThumbsDown size={15} fill={hasDisliked ? 'currentColor' : 'none'} />
                  {dislikeCount} Dislike{dislikeCount > 1 ? 's' : ''}
                </button>
              </div>
              {!user && (
                <p className="text-center text-xs text-[var(--text-muted)] mt-2">Connectez-vous pour voter</p>
              )}
            </div>

            {/* Meta */}
            <div className="glass-card-static p-4 sm:p-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1 font-bold uppercase tracking-widest">Ajouté le</p>
                <p className="text-[var(--text-secondary)] flex items-center gap-1.5"><Calendar size={13} className="text-[var(--text-muted)]" />{date}</p>
              </div>
              {project.specialty && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1 font-bold uppercase tracking-widest">Spécialité</p>
                  <p className="text-[var(--text-secondary)]">{project.specialty}</p>
                </div>
              )}
              {project.link && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1 font-bold uppercase tracking-widest">Livrable</p>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-80 transition-opacity"
                  >
                    <ExternalLink size={13} /> Voir le lien
                  </a>
                </div>
              )}
            </div>

            {/* Actions admin/owner */}
            {canEdit && (
              <div className="glass-card-static p-4 sm:p-5 space-y-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => navigate(`/projects/${id}/edit`)}
                  fullWidth
                >
                  <Pencil size={13} /> Modifier
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => { if (confirm('Supprimer ce projet ?')) deleteMutation.mutate(); }}
                  disabled={deleteMutation.isPending}
                  fullWidth
                >
                  <Trash2 size={13} /> Supprimer
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}