import api from '../lib/api';
import type { Project } from '../types';

export const voteService = {
  hasVoted(projectId: string): Promise<boolean> {
    return api.get<{ voted: boolean }>(`/projects/${projectId}/votes/me`).then((r) => r.data.voted);
  },

  vote(projectId: string): Promise<void> {
    return api.post(`/projects/${projectId}/votes`).then(() => undefined);
  },

  unvote(projectId: string): Promise<void> {
    return api.delete(`/projects/${projectId}/votes`).then(() => undefined);
  },

  hasDisliked(projectId: string): Promise<boolean> {
    return api.get<{ disliked: boolean }>(`/projects/${projectId}/dislikes/me`).then((r) => r.data.disliked);
  },

  dislike(projectId: string): Promise<void> {
    return api.post(`/projects/${projectId}/dislikes`).then(() => undefined);
  },

  undislike(projectId: string): Promise<void> {
    return api.delete(`/projects/${projectId}/dislikes`).then(() => undefined);
  },

  getMyVotedProjects(): Promise<Project[]> {
    return api.get<{ projects: Project }[]>('/votes/my').then((r) =>
      r.data.map((v) => v.projects).filter(Boolean),
    );
  },
};
