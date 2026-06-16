import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { VotesService } from './votes.service';

@Controller('projects/:projectId/votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get()
  getCount(@Param('projectId') projectId: string) {
    return this.votesService.getCount(projectId);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  hasVoted(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.hasVoted(projectId, req.user.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  vote(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.vote(projectId, req.user.id);
  }

  @Delete()
  @UseGuards(AuthGuard)
  unvote(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.unvote(projectId, req.user.id);
  }
}
