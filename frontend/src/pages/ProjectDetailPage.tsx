import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, ExternalLink, Heart, Pencil, Tag, Trash2, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import type { Project } from '../types';

const STATUS_LABEL: Record<string, string> = {
  idea: 'Idée',
  in_progress: 'En cours',
  completed: 'Terminé',
};
const STATUS_COLOR: Record<string, string> = {
  idea: 'bg-violet-100 text-violet-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
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

  const voteMutation = useMutation({
    mutationFn: () => hasVoted
      ? api.delete(`/projects/${id}/votes`)
      : api.post(`/projects/${id}/votes`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['vote', id, user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => navigate('/'),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500">Projet introuvable.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:underline text-sm">Retour à l'accueil</button>
      </div>
    );
  }

  const voteCount = project.votes?.[0]?.count ?? 0;
  const canEdit = user?.id === project.creator_id || isAdmin;
  const date = new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-56px)]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Retour aux projets
        </button>

        <div className="grid grid-cols-3 gap-6 items-start">
          {/* Main content */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">{project.theme}</span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_COLOR[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.title}</h1>
              {project.team_name && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-6">
                  <Users size={13} /> {project.team_name}
                </p>
              )}

              <div className="space-y-5">
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{project.description}</p>
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Objectif</h2>
                  <p className="text-gray-700 leading-relaxed">{project.objective}</p>
                </div>
              </div>

              {project.tags?.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
                      <Tag size={11} /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Vote */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <button
                onClick={() => user ? voteMutation.mutate() : navigate('/login')}
                disabled={voteMutation.isPending}
                className={`w-full flex items-center justify-center gap-2 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 border ${
                  hasVoted
                    ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                }`}
              >
                <Heart size={16} fill={hasVoted ? 'currentColor' : 'none'} />
                {voteCount} Like{voteCount > 1 ? 's' : ''}
              </button>
              {!user && (
                <p className="text-center text-xs text-gray-400 mt-2">Connectez-vous pour voter</p>
              )}
            </div>

            {/* Meta */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Ajouté le</p>
                <p className="text-gray-700 flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" />{date}</p>
              </div>
              {project.specialty && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Spécialité</p>
                  <p className="text-gray-700">{project.specialty}</p>
                </div>
              )}
              {project.link && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Livrable</p>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-indigo-600 hover:underline"
                  >
                    <ExternalLink size={13} /> Voir le lien
                  </a>
                </div>
              )}
            </div>

            {/* Actions admin/owner */}
            {canEdit && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
                <button
                  onClick={() => navigate(`/projects/${id}/edit`)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={13} /> Modifier
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { if (confirm('Supprimer ce projet ?')) deleteMutation.mutate(); }}
                    disabled={deleteMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 text-sm text-red-500 border border-red-200 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} /> Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
