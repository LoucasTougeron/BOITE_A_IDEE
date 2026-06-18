import api from '../lib/api';
import type { Project } from '../types';

export interface ProjectFilters {
  search?: string;
  theme?: string;
  status?: string;
  sortBy?: 'score' | 'date';
}

export interface ProjectPayload {
  title: string;
  description: string;
  objective: string;
  theme: string;
  tags: string[];
  link?: string;
  file_url?: string;
  team_name?: string;
  specialty?: string;
  status: string;
}

export const projectService = {
  getAll(filters?: ProjectFilters): Promise<Project[]> {
    return api.get<Project[]>('/projects', { params: filters }).then((r) => r.data);
  },

  getById(id: string): Promise<Project> {
    return api.get<Project>(`/projects/${id}`).then((r) => r.data);
  },

  getRandom(): Promise<Project> {
    return api.get<Project>('/projects/random').then((r) => r.data);
  },

  create(payload: ProjectPayload): Promise<Project> {
    return api.post<Project>('/projects', payload).then((r) => r.data);
  },

  update(id: string, payload: ProjectPayload): Promise<Project> {
    return api.put<Project>(`/projects/${id}`, payload).then((r) => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/projects/${id}`).then(() => undefined);
  },

  scoreOne(id: string): Promise<{ ok: boolean }> {
    return api.post(`/scoring/project/${id}`).then((r) => r.data);
  },

  scoreAll(): Promise<{ scored: number }> {
    return api.post('/scoring/all').then((r) => r.data);
  },
};
