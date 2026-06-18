import { Controller, Param, Post, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ScoringService } from './scoring.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('scoring')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class ScoringController {
  constructor(
    private readonly scoringService: ScoringService,
    private readonly supabase: SupabaseService,
  ) {}

  @Post('project/:id')
  async scoreOne(@Param('id') id: string) {
    const { data: project, error } = await this.supabase.db
      .from('projects')
      .select('*, votes(count)')
      .eq('id', id)
      .single();
    if (error || !project) throw new NotFoundException();
    await this.scoringService.scoreAndUpdate(project);
    return { ok: true };
  }

  @Post('all')
  async scoreAll() {
    const { data: projects, error } = await this.supabase.db
      .from('projects')
      .select('*, votes(count)');
    if (error) throw error;

    for (const project of projects ?? []) {
      await this.scoringService.scoreAndUpdate(project);
      await new Promise((r) => setTimeout(r, 1500));
    }
    return { scored: projects?.length ?? 0 };
  }
}
