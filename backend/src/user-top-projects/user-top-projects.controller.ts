import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SaveTopProjectsDto } from './dto/save-top-projects.dto';
import { UserTopProjectsService } from './user-top-projects.service';

@Controller('user-top-projects')
@UseGuards(AuthGuard)
export class UserTopProjectsController {
  constructor(private readonly service: UserTopProjectsService) {}

  @Get('me')
  getMyTopProjects(@Req() req: any) {
    return this.service.getMyTopProjects(req.user.id);
  }

  @Post('me')
  saveMyTopProjects(@Body() dto: SaveTopProjectsDto, @Req() req: any) {
    return this.service.saveMyTopProjects(req.user.id, dto.rankings);
  }

  @Get('stats')
  @Roles('admin')
  @UseGuards(RolesGuard)
  getStats(@Query('team_id') teamId?: string) {
    return this.service.getStats(teamId);
  }

  @Get('stats/teams')
  @Roles('admin')
  @UseGuards(RolesGuard)
  getTeamStats() {
    return this.service.getTeamStats();
  }
}
