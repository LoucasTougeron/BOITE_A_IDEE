import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface RewardTrophy {
  id: string;
  key: string;
  title: string;
  description: string;
  category: string;
  threshold: number;
  rarity: string;
  points: number;
}

interface RewardProgress extends RewardTrophy {
  progress: number;
  earned: boolean;
}

interface UserStats {
  ideaCount: number;
  votesGivenCount: number;
  maxLikes: number;
  totalLikes: number;
  mostLikedProject: { id: string; title: string; likes: number } | null;
  participationCount: number;
}

@Injectable()
export class RewardsService {
  constructor(private supabase: SupabaseService) {}

  private getLevelThresholds() {
    return [
      { name: 'Nouvel arrivant', min: 0, max: 49 },
      { name: 'Explorateur', min: 50, max: 149 },
      { name: 'Innovateur', min: 150, max: 299 },
      { name: 'Actionnaire', min: 300, max: 599 },
      { name: 'Directeur', min: 600, max: 999 },
      { name: 'Visionnaire', min: 1000, max: Infinity },
    ];
  }

  private calculateLevel(points: number) {
    if (points >= 1000) return 'Visionnaire';
    if (points >= 600) return 'Directeur';
    if (points >= 300) return 'Actionnaire';
    if (points >= 150) return 'Innovateur';
    if (points >= 50) return 'Explorateur';
    return 'Nouvel arrivant';
  }

  private getNextLevelThreshold(points: number): number {
    const thresholds = [0, 50, 150, 300, 600, 1000];
    for (const t of thresholds) {
      if (points < t) return t;
    }
    return 1000;
  }

  private async getUserStats(userId: string) {
    const { data: projects } = await this.supabase.db
      .from('projects')
      .select('id')
      .eq('creator_id', userId);

    const ideaCount = projects?.length ?? 0;
    const projectIds = projects?.map((project: any) => project.id) ?? [];

    const { data: votesGiven } = await this.supabase.db
      .from('votes')
      .select('id')
      .eq('user_id', userId);

    const { data: participations } = await this.supabase.db
      .from('rewards_participations')
      .select('id')
      .eq('user_id', userId);

    let maxLikes = 0;
    let totalLikes = 0;
    let mostLikedProject: { id: string; title: string; likes: number } | null = null;

    if (projectIds.length > 0) {
      const { data: projectVotes } = await this.supabase.db
        .from('votes')
        .select('project_id')
        .in('project_id', projectIds);

      const { data: projectDetails } = await this.supabase.db
        .from('projects')
        .select('id, title')
        .in('id', projectIds);

      const counts = projectVotes?.reduce((acc: Record<string, number>, vote: any) => {
        acc[vote.project_id] = (acc[vote.project_id] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>) ?? {};

      totalLikes = Object.values(counts).reduce((sum: number, count: number) => sum + count, 0);
      const [mostLikedId, likes] = Object.entries(counts).reduce(
        (max, [id, count]) => ((count as number) > max[1] ? [id, count as number] : max),
        ['', 0]
      );

      if (mostLikedId && projectDetails) {
        const project = projectDetails.find((p: any) => p.id === mostLikedId);
        if (project) {
          mostLikedProject = { id: mostLikedId, title: project.title, likes };
          maxLikes = likes;
        }
      }
    }

    return {
      ideaCount,
      votesGivenCount: votesGiven?.length ?? 0,
      maxLikes,
      totalLikes,
      mostLikedProject,
      participationCount: participations?.length ?? 0,
    };
  }

  private buildProgress(trophies: RewardTrophy[], stats: UserStats) {
    return trophies.map((trophy) => {
      let current = 0;
      if (trophy.category === 'ideas') current = stats.ideaCount;
      if (trophy.category === 'votes') current = stats.votesGivenCount;
      if (trophy.category === 'likes') current = stats.maxLikes;
      if (trophy.category === 'participation') current = stats.participationCount;

      return {
        ...trophy,
        progress: Math.min(current, trophy.threshold),
        earned: current >= trophy.threshold,
      };
    });
  }

  private async awardNewTrophies(userId: string, progress: RewardProgress[]) {
    const earnedTrophies = progress.filter((item) => item.earned);
    const { data: existing } = await this.supabase.db
      .from('user_trophies')
      .select('trophy_id')
      .eq('user_id', userId);

    const existingIds = new Set(existing?.map((entry: any) => entry.trophy_id) ?? []);
    const newTrophies = earnedTrophies.filter((trophy) => !existingIds.has(trophy.id));

    if (newTrophies.length === 0) {
      return [];
    }

    const inserts = newTrophies.map((trophy) => ({ user_id: userId, trophy_id: trophy.id }));
    const { error } = await this.supabase.db.from('user_trophies').insert(inserts);
    if (error) throw error;
    return newTrophies;
  }

  private async updateUserScore(userId: string, points: number) {
    const level = this.calculateLevel(points);
    const { error } = await this.supabase.db
      .from('users')
      .update({ points, level })
      .eq('id', userId);
    if (error) throw error;
    return { points, level };
  }

  async incrementUserPoints(userId: string, amount: number) {
    const { data: user, error } = await this.supabase.db
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();
    if (error || !user) return;
    const newPoints = Math.max(0, (user.points ?? 0) + amount);
    await this.supabase.db
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);
  }

  async getUserRewards(userId: string) {
    const { data: user } = await this.supabase.db
      .from('users')
      .select('id, points, level')
      .eq('id', userId)
      .single();

    const { data: trophies } = await this.supabase.db
      .from('reward_trophies')
      .select('*')
      .order('threshold', { ascending: true });

    const stats = await this.getUserStats(userId);
    const progress = this.buildProgress(trophies || [], stats);

    const newTrophies = await this.awardNewTrophies(userId, progress);
    const previousPoints = user?.points ?? 0;
    const previousLevel = user?.level ?? this.calculateLevel(0);
    const newTrophyPoints = newTrophies.reduce((sum, item) => sum + item.points, 0);
    const updatedPoints = newTrophies.length > 0 ? previousPoints + newTrophyPoints : (user?.points ?? 0);
    if (newTrophies.length > 0) {
      await this.updateUserScore(userId, updatedPoints);
    }

    const { data: earnedRaw } = await this.supabase.db
      .from('user_trophies')
      .select('trophy_id, awarded_at, reward_trophies(*)')
      .eq('user_id', userId);

    const earned = (earnedRaw || []).map((entry: any) => ({
      id: entry.trophy_id,
      awarded_at: entry.awarded_at,
      ...entry.reward_trophies,
    }));

    const points = newTrophies.length > 0 ? updatedPoints : (user?.points ?? earned.reduce((sum: number, trophy: any) => sum + trophy.points, 0));
    const level = this.calculateLevel(points);
    const levelChanged = previousLevel !== level;
    if (levelChanged) {
      await this.supabase.db
        .from('users')
        .update({ level })
        .eq('id', userId);
    }

    const nextLevelThreshold = this.getNextLevelThreshold(points);
    const pointsForNextLevel = nextLevelThreshold - points;
    const levels = this.getLevelThresholds();
    const currentLevelInfo = levels.find((l) => l.min <= points && points < l.max);
    const nextLevelInfo = levels.find((l) => l.min === nextLevelThreshold);

    return {
      stats,
      points,
      level,
      progress,
      earned,
      participationCount: stats.participationCount,
      nextLevel: nextLevelInfo?.name || 'Visionnaire',
      pointsForNextLevel: Math.max(0, pointsForNextLevel),
      progressToNextLevel: currentLevelInfo ? Math.min(((points - currentLevelInfo.min) / (currentLevelInfo.max - currentLevelInfo.min)) * 100, 100) : 0,
      notifications: {
        newTrophies: newTrophies.map((t) => ({ type: 'trophy', title: t.title, description: t.description })),
        levelChanged: levelChanged ? { type: 'level', level } : null,
      },
    };
  }

  async participate(userId: string) {
    const lottery = [
      { prize: 'Pack de 50 points', points: 50, status: 'won', weight: 5 },
      { prize: 'Badge rare', points: 25, status: 'won', weight: 10 },
      { prize: 'Accès prioritaire', points: 15, status: 'won', weight: 15 },
      { prize: 'Aucune récompense cette fois', points: 0, status: 'lost', weight: 70 },
    ];

    const totalWeight = lottery.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    const result = lottery.find((item) => {
      roll -= item.weight;
      return roll <= 0;
    }) || lottery[lottery.length - 1];

    const participation = {
      user_id: userId,
      status: result.status,
      prize: result.prize,
      entry_data: { awarded_points: result.points },
    };

    const { data, error } = await this.supabase.db.from('rewards_participations').insert(participation).select().single();
    if (error) throw error;

    if (result.points > 0) {
      const { data: user } = await this.supabase.db
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      const updatedPoints = (user?.points ?? 0) + result.points;
      await this.updateUserScore(userId, updatedPoints);
    }

    return {
      participation: data,
      rewards: await this.getUserRewards(userId),
    };
  }
}
