import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RewardsService } from '../rewards/rewards.service';

@Injectable()
export class VotesService {
  constructor(
    private supabase: SupabaseService,
    private rewardsService: RewardsService,
  ) {}

  async getMyVotes(userId: string) {
    const { data, error } = await this.supabase.db
      .from('votes')
      .select('project_id, projects(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  async getAllDetailedVotes() {
    const { data, error } = await this.supabase.db
      .from('votes')
      .select(`
        id,
        created_at,
        projects ( id, title, theme ),
        users ( id, first_name, last_name, email, teams (name) )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getCount(projectId: string) {
    const { count } = await this.supabase.db
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
    return { count };
  }

  private async getProjectCreatorId(projectId: string): Promise<string | null> {
    const { data, error } = await this.supabase.db
      .from('projects')
      .select('creator_id')
      .eq('id', projectId)
      .single();
    if (error || !data) return null;
    return data.creator_id;
  }

  async vote(projectId: string, userId: string) {
    // Check if they already liked it
    const { voted } = await this.hasVoted(projectId, userId);
    if (voted) {
      // Already voted, fetch it to return it
      const { data } = await this.supabase.db
        .from('votes')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();
      return data;
    }

    // Check if they had disliked it
    const { disliked } = await this.hasDisliked(projectId, userId);
    if (disliked) {
      // Remove dislike first
      await this.supabase.db
        .from('dislikes')
        .delete()
        .match({ project_id: projectId, user_id: userId });

      // Insert vote (like)
      const { data, error } = await this.supabase.db
        .from('votes')
        .upsert({ project_id: projectId, user_id: userId }, { onConflict: 'project_id,user_id' })
        .select()
        .single();
      if (error) throw error;

      // Points: Voter doesn't change (still 1 vote total). Creator gets +5 points (new like).
      const creatorId = await this.getProjectCreatorId(projectId);
      if (creatorId) {
        await this.rewardsService.incrementUserPoints(creatorId, 5);
      }
      return data;
    } else {
      // Insert vote (like)
      const { data, error } = await this.supabase.db
        .from('votes')
        .upsert({ project_id: projectId, user_id: userId }, { onConflict: 'project_id,user_id' })
        .select()
        .single();
      if (error) throw error;

      // Points: Voter gets +2 points. Creator gets +5 points (new like).
      await this.rewardsService.incrementUserPoints(userId, 2);
      const creatorId = await this.getProjectCreatorId(projectId);
      if (creatorId) {
        await this.rewardsService.incrementUserPoints(creatorId, 5);
      }
      return data;
    }
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
    const { voted } = await this.hasVoted(projectId, userId);
    if (!voted) return { removed: false };

    const { error } = await this.supabase.db
      .from('votes')
      .delete()
      .match({ project_id: projectId, user_id: userId });
    if (error) throw error;

    // Points: Voter loses -2 points. Creator loses -5 points.
    await this.rewardsService.incrementUserPoints(userId, -2);
    const creatorId = await this.getProjectCreatorId(projectId);
    if (creatorId) {
      await this.rewardsService.incrementUserPoints(creatorId, -5);
    }
    return { removed: true };
  }

  async dislike(projectId: string, userId: string) {
    // Check if they already disliked it
    const { disliked } = await this.hasDisliked(projectId, userId);
    if (disliked) {
      const { data } = await this.supabase.db
        .from('dislikes')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();
      return data;
    }

    // Check if they liked it
    const { voted } = await this.hasVoted(projectId, userId);
    if (voted) {
      // Remove like first
      await this.supabase.db
        .from('votes')
        .delete()
        .match({ project_id: projectId, user_id: userId });

      // Insert dislike
      const { data, error } = await this.supabase.db
        .from('dislikes')
        .upsert({ project_id: projectId, user_id: userId }, { onConflict: 'project_id,user_id' })
        .select()
        .single();
      if (error) throw error;

      // Points: Voter doesn't change (still 1 vote total). Creator loses -5 points (lost like).
      const creatorId = await this.getProjectCreatorId(projectId);
      if (creatorId) {
        await this.rewardsService.incrementUserPoints(creatorId, -5);
      }
      return data;
    } else {
      // Insert dislike
      const { data, error } = await this.supabase.db
        .from('dislikes')
        .upsert({ project_id: projectId, user_id: userId }, { onConflict: 'project_id,user_id' })
        .select()
        .single();
      if (error) throw error;

      // Points: Voter gets +2 points. Creator 0 change.
      await this.rewardsService.incrementUserPoints(userId, 2);
      return data;
    }
  }

  async hasDisliked(projectId: string, userId: string) {
    const { data } = await this.supabase.db
      .from('dislikes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();
    return { disliked: !!data };
  }

  async undislike(projectId: string, userId: string) {
    const { disliked } = await this.hasDisliked(projectId, userId);
    if (!disliked) return { removed: false };

    const { error } = await this.supabase.db
      .from('dislikes')
      .delete()
      .match({ project_id: projectId, user_id: userId });
    if (error) throw error;

    // Points: Voter loses -2 points.
    await this.rewardsService.incrementUserPoints(userId, -2);
    return { removed: true };
  }
}
