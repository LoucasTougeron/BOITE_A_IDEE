import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { RewardsService } from '../rewards/rewards.service';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly rewardsService: RewardsService,
    private readonly scoringService: ScoringService,
  ) {}

  async findAll(query: Record<string, string>) {
    let req = this.supabase.db
      .from('projects')
      .select('*, votes(count), dislikes(count)')
      .order('created_at', { ascending: false });

    if (query.search) {
      req = req.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }
    if (query.theme) req = req.eq('theme', query.theme);
    if (query.status) req = req.eq('status', query.status);
    if (query.specialty) req = req.eq('specialty', query.specialty);
    if (query.tag) req = req.contains('tags', [query.tag]);

    const { data, error } = await req;
    if (error) throw error;

    const enriched = (data ?? []).map((p) => this.scoringService.enrichWithFinalScore(p));

    if (query.sortBy === 'score') {
      enriched.sort((a, b) => b.final_score - a.final_score);
    }

    return enriched;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.db
      .from('projects')
      .select('*, votes(count), dislikes(count)')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException();
    return this.scoringService.enrichWithFinalScore(data);
  }

  async getRandom() {
    const { data, error } = await this.supabase.db
      .from('projects')
      .select('id');
    if (error || !data?.length) throw new NotFoundException('No projects found');

    const random = data[Math.floor(Math.random() * data.length)];
    return this.findOne(random.id);
  }

  async create(dto: CreateProjectDto, userId: string) {
    const { data, error } = await this.supabase.db
      .from('projects')
      .insert({ ...dto, creator_id: userId })
      .select()
      .single();
    if (error) throw error;

    await this.rewardsService.incrementUserPoints(userId, 15);

    // Fire-and-forget: score the project without blocking the response
    this.scoringService.scoreAndUpdate(data).catch(() => {});

    return data;
  }

  async update(id: string, dto: Partial<CreateProjectDto>, user: any) {
    const project = await this.findOne(id);
    const isAdmin = user?.role === 'admin';
    if (project.creator_id !== user.id && !isAdmin) throw new ForbiddenException();

    const updatePayload: any = { ...dto };
    delete updatePayload.id;
    delete updatePayload.creator_id;
    delete updatePayload.created_at;
    delete updatePayload.updated_at;
    delete updatePayload.votes;
    delete updatePayload.dislikes;
    delete updatePayload.ai_score;
    delete updatePayload.completeness_score;
    delete updatePayload.score_reasoning;
    delete updatePayload.score_updated_at;
    delete updatePayload.final_score;

    const { data, error } = await this.supabase.db
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Fire-and-forget: re-score after content change
    this.scoringService.scoreAndUpdate(data).catch(() => {});

    return data;
  }

  async remove(id: string, user: any) {
    const { data: project } = await this.supabase.db
      .from('projects')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!project) throw new NotFoundException();
    if (project.creator_id !== user.id && user.role !== 'admin') throw new ForbiddenException();

    const creatorId = project.creator_id;
    {

      const { data: votes } = await this.supabase.db
        .from('votes')
        .select('user_id')
        .eq('project_id', id);

      const { data: dislikes } = await this.supabase.db
        .from('dislikes')
        .select('user_id')
        .eq('project_id', id);

      const voterIds = votes?.map((v: any) => v.user_id) ?? [];
      const dislikerIds = dislikes?.map((d: any) => d.user_id) ?? [];

      if (creatorId) {
        await this.rewardsService.incrementUserPoints(creatorId, -15);
        const likeCount = voterIds.length;
        if (likeCount > 0) {
          await this.rewardsService.incrementUserPoints(creatorId, -(likeCount * 5));
        }
      }

      for (const voterId of voterIds) {
        await this.rewardsService.incrementUserPoints(voterId, -2);
      }

      for (const dislikerId of dislikerIds) {
        await this.rewardsService.incrementUserPoints(dislikerId, -2);
      }
    }

    const { error } = await this.supabase.db
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { deleted: true };
  }
}
