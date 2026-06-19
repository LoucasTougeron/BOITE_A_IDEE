import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { VotesService } from './votes.service';

@Controller('votes')
@UseGuards(AuthGuard)
export class AllVotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  getAllDetailedVotes() {
    return this.votesService.getAllDetailedVotes();
  }

  @Get('my')
  getMyVotes(@Req() req: any) {
    return this.votesService.getMyVotes(req.user.id);
  }
}
