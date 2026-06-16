import { ArrowUpRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';

const STATUS_LABEL: Record<string, string> = {
  idea: 'Idée',
  in_progress: 'En cours',
  completed: 'Terminé',
};

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate();
  const voteCount = project.votes?.[0]?.count ?? 0;

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="glass-card p-5 cursor-pointer flex flex-col group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`theme-badge theme-badge-${project.theme.toLowerCase()}`}>
          {project.theme}
        </span>
        <span className={`badge badge-${project.status}`}>
          {STATUS_LABEL[project.status] ?? project.status}
        </span>
      </div>

      <h3 className="font-semibold text-[var(--text-primary)] mb-1.5 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300 text-base">
        {project.title}
      </h3>
      <p className="text-[var(--text-muted)] text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">
        {project.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border-light)]">
        <div className="flex flex-wrap gap-1.5">
          {project.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
          {(project.tags?.length ?? 0) > 3 && (
            <span className="text-xs text-[var(--text-muted)]">+{project.tags.length - 3}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
            <Heart size={13} className={voteCount > 0 ? 'text-pink-400 fill-pink-400' : ''} />
            <span className="font-medium">{voteCount}</span>
          </div>
          <div className="w-6 h-6 rounded-lg bg-[var(--border-light)] flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all">
            <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent-2)] transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}