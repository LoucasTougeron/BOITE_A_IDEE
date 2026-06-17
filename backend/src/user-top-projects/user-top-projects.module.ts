import { Module } from '@nestjs/common';
import { UserTopProjectsController } from './user-top-projects.controller';
import { UserTopProjectsService } from './user-top-projects.service';

@Module({
  controllers: [UserTopProjectsController],
  providers: [UserTopProjectsService],
  exports: [UserTopProjectsService],
})
export class UserTopProjectsModule {}