import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UserTopProjectsService {
  constructor(private supabase: SupabaseService) {}

  async getMyTopProjects(userId: string) {
    const { data, error } = await this.supabase.db
      .from('user_top_projects')
      .select('id, rank, project_id, projects(*)')
      .eq('user_id', userId)
      .order('rank', { ascending: true });
    if (error) throw error;
    return data;
  }

  async saveMyTopProjects(userId: string, rankings: { project_id: string; rank: number }[]) {
    await this.supabase.db
      .from('user_top_projects')
      .delete()
      .eq('user_id', userId);

    if (rankings.length === 0) return [];

    const rows = rankings.map((r) => ({
      user_id: userId,
      project_id: r.project_id,
      rank: r.rank,
    }));

    const { data, error } = await this.supabase.db
      .from('user_top_projects')
      .insert(rows)
      .select('id, rank, project_id, projects(*)')
      .order('rank', { ascending: true });

    if (error) throw error;
    return data;
  }

  // --- Statistiques pour le dashboard pédagogique ---

  async getStats(teamId?: string) {
    // Si un teamId est fourni, récupérer les user_id de cette classe
    let userIds: string[] | undefined;
    if (teamId) {
      const { data: users } = await this.supabase.db
        .from('users')
        .select('id')
        .eq('team_id', teamId);
      if (!users || users.length === 0) {
        return { byLikes: [], byTopScore: [] };
      }
      userIds = users.map((u: any) => u.id);
    }

    // 1. Compter les likes par projet
    let likesQuery = this.supabase.db
      .from('votes')
      .select('project_id, projects!inner(title, theme, specialty)');

    if (userIds && userIds.length > 0) {
      likesQuery = likesQuery.in('user_id', userIds);
    }

    const { data: votes, error: votesError } = await likesQuery;
    if (votesError) throw votesError;

    const likesMap = new Map<string, { title: string; theme: string; specialty: string; likes: number }>();
    (votes || []).forEach((v: any) => {
      const pid = v.project_id;
      if (!likesMap.has(pid)) {
        likesMap.set(pid, { title: v.projects.title, theme: v.projects.theme, specialty: v.projects.specialty || '', likes: 0 });
      }
      likesMap.get(pid)!.likes++;
    });

    // 2. Compter les points Top 3 (rank 1 = 3pts, rank 2 = 2pts, rank 3 = 1pt)
    let topQuery = this.supabase.db
      .from('user_top_projects')
      .select('project_id, rank, projects!inner(title, theme)');

    if (userIds && userIds.length > 0) {
      topQuery = topQuery.in('user_id', userIds);
    }

    const { data: topProjects, error: topError } = await topQuery;
    if (topError) throw topError;

    const topScoreMap = new Map<string, { totalPoints: number; top1Count: number; top2Count: number; top3Count: number }>();
    (topProjects || []).forEach((t: any) => {
      const pid = t.project_id;
      if (!topScoreMap.has(pid)) {
        topScoreMap.set(pid, { totalPoints: 0, top1Count: 0, top2Count: 0, top3Count: 0 });
      }
      const entry = topScoreMap.get(pid)!;
      const points = t.rank === 1 ? 3 : t.rank === 2 ? 2 : 1;
      entry.totalPoints += points;
      if (t.rank === 1) entry.top1Count++;
      else if (t.rank === 2) entry.top2Count++;
      else if (t.rank === 3) entry.top3Count++;
    });

    // Fusionner
    const allProjectIds = new Set([...likesMap.keys(), ...topScoreMap.keys()]);
    const stats = Array.from(allProjectIds).map((pid) => ({
      project_id: pid,
      title: likesMap.get(pid)?.title ?? 'Projet supprimé',
      theme: likesMap.get(pid)?.theme ?? '',
      specialty: likesMap.get(pid)?.specialty ?? '',
      likes: likesMap.get(pid)?.likes ?? 0,
      topScore: topScoreMap.get(pid)?.totalPoints ?? 0,
      top1Count: topScoreMap.get(pid)?.top1Count ?? 0,
      top2Count: topScoreMap.get(pid)?.top2Count ?? 0,
      top3Count: topScoreMap.get(pid)?.top3Count ?? 0,
    }));

    return {
      byLikes: [...stats].sort((a, b) => b.likes - a.likes),
      byTopScore: [...stats].sort((a, b) => b.topScore - a.topScore),
    };
  }

  async getTeamStats() {
    const { data: teams } = await this.supabase.db
      .from('teams')
      .select('id, name');
    if (!teams) return [];

    const results: any[] = [];
    for (const team of teams) {
      const stats = await this.getStats(team.id);
      results.push({
        team_id: team.id,
        team_name: team.name,
        ...stats,
      });
    }
    return results;
  }
}