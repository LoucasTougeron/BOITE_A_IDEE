import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { VotesService } from './votes.service';

@Controller('votes')
@UseGuards(AuthGuard)
export class AllVotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get()
  getAllDetailedVotes() {
    return this.votesService.getAllDetailedVotes();
  }

  @Get('my')
  getMyVotes(@Req() req: any) {
    return this.votesService.getMyVotes(req.user.id);
  }
}
