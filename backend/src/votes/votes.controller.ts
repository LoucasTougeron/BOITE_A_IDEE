import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { VotesService } from './votes.service';

@Controller('projects/:projectId')
@UseGuards(AuthGuard)
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get('votes')
  getCount(@Param('projectId') projectId: string) {
    return this.votesService.getCount(projectId);
  }

  @Get('votes/me')
  hasVoted(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.hasVoted(projectId, req.user.id);
  }

  @Post('votes')
  vote(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.vote(projectId, req.user.id);
  }

  @Delete('votes')
  unvote(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.unvote(projectId, req.user.id);
  }

  @Get('dislikes/me')
  hasDisliked(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.hasDisliked(projectId, req.user.id);
  }

  @Post('dislikes')
  dislike(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.dislike(projectId, req.user.id);
  }

  @Delete('dislikes')
  undislike(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.undislike(projectId, req.user.id);
  }
}
