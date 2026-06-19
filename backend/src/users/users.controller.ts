import { Body, Controller, ForbiddenException, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('me')
  updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Put(':id/team')
  updateTeam(@Param('id') id: string, @Body() body: { team_id: string | null }, @Req() req: any) {
    if (id !== req.user.id && req.user.role !== 'admin') throw new ForbiddenException();
    return this.usersService.updateProfile(id, { team_id: body.team_id });
  }
}
