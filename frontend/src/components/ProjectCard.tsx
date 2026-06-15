import { ArrowUpRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';

const STATUS_LABEL: Record<string, string> = {
  idea: 'Idée',
  in_progress: 'En cours',
  completed: 'Terminé',
};
const STATUS_COLOR: Record<string, string> = {
  idea: 'bg-violet-50 text-violet-600',
  in_progress: 'bg-amber-50 text-amber-600',
  completed: 'bg-emerald-50 text-emerald-600',
};
const THEME_COLOR: Record<string, string> = {
  Tech: 'bg-blue-50 text-blue-700',
  Design: 'bg-pink-50 text-pink-700',
  Business: 'bg-orange-50 text-orange-700',
  Social: 'bg-teal-50 text-teal-700',
  Science: 'bg-purple-50 text-purple-700',
  Art: 'bg-rose-50 text-rose-700',
};

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate();
  const voteCount = project.votes?.[0]?.count ?? 0;
  const themeColor = THEME_COLOR[project.theme] ?? 'bg-gray-100 text-gray-600';
  const statusColor = STATUS_COLOR[project.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="group bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-150 flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${themeColor}`}>
          {project.theme}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
          {STATUS_LABEL[project.status] ?? project.status}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-indigo-700 transition-colors">
        {project.title}
      </h3>
      <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">
        {project.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-1">
          {project.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              #{tag}
            </span>
          ))}
          {(project.tags?.length ?? 0) > 3 && (
            <span className="text-xs text-gray-400">+{project.tags.length - 3}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Heart size={13} />
            <span>{voteCount}</span>
          </div>
          <ArrowUpRight size={15} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}
