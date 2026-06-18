import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { RewardsModule } from '../rewards/rewards.module';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [RewardsModule, ScoringModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
