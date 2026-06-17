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
    // Delete existing top projects for this user
    await this.supabase.db
      .from('user_top_projects')
      .delete()
      .eq('user_id', userId);

    if (rankings.length === 0) return [];

    // Insert new rankings
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
}