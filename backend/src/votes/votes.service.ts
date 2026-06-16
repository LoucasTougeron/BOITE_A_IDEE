import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class VotesService {
  constructor(private supabase: SupabaseService) {}

  async getCount(projectId: string) {
    const { count } = await this.supabase.db
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
    return { count };
  }

  async vote(projectId: string, userId: string) {
    const { data, error } = await this.supabase.db
      .from('votes')
      .upsert({ project_id: projectId, user_id: userId }, { onConflict: 'project_id,user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async hasVoted(projectId: string, userId: string) {
    const { data } = await this.supabase.db
      .from('votes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();
    return { voted: !!data };
  }

  async unvote(projectId: string, userId: string) {
    const { error } = await this.supabase.db
      .from('votes')
      .delete()
      .match({ project_id: projectId, user_id: userId });
    if (error) throw error;
    return { removed: true };
  }
}
