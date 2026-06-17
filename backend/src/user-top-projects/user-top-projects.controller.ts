import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserTopProjectsService } from './user-top-projects.service';

@Controller('user-top-projects')
export class UserTopProjectsController {
  constructor(private readonly service: UserTopProjectsService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getMyTopProjects(@Req() req: any) {
    return this.service.getMyTopProjects(req.user.id);
  }

  @Post('me')
  @UseGuards(AuthGuard)
  saveMyTopProjects(@Body() body: { rankings: { project_id: string; rank: number }[] }, @Req() req: any) {
    return this.service.saveMyTopProjects(req.user.id, body.rankings);
  }
}