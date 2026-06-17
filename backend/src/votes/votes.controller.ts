import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { VotesService } from './votes.service';

@Controller('projects/:projectId')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get('votes')
  getCount(@Param('projectId') projectId: string) {
    return this.votesService.getCount(projectId);
  }

  @Get('votes/me')
  @UseGuards(AuthGuard)
  hasVoted(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.hasVoted(projectId, req.user.id);
  }

  @Post('votes')
  @UseGuards(AuthGuard)
  vote(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.vote(projectId, req.user.id);
  }

  @Delete('votes')
  @UseGuards(AuthGuard)
  unvote(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.unvote(projectId, req.user.id);
  }

  @Get('dislikes/me')
  @UseGuards(AuthGuard)
  hasDisliked(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.hasDisliked(projectId, req.user.id);
  }

  @Post('dislikes')
  @UseGuards(AuthGuard)
  dislike(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.dislike(projectId, req.user.id);
  }

  @Delete('dislikes')
  @UseGuards(AuthGuard)
  undislike(@Param('projectId') projectId: string, @Req() req: any) {
    return this.votesService.undislike(projectId, req.user.id);
  }
}
