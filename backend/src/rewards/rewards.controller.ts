import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RewardsService } from './rewards.service';

@Controller('rewards')
@UseGuards(AuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('me')
  async getMyRewards(@Req() req: any) {
    return this.rewardsService.getUserRewards(req.user.id);
  }

  @Post('participate')
  async participate(@Req() req: any) {
    return this.rewardsService.participate(req.user.id);
  }
}
