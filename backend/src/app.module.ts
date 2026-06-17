import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BudgetModule } from './budget/budget.module';
import { ProjectsModule } from './projects/projects.module';
import { RewardsModule } from './rewards/rewards.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UserTopProjectsModule } from './user-top-projects/user-top-projects.module';
import { UsersModule } from './users/users.module';
import { VotesModule } from './votes/votes.module';

import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    ProjectsModule,
    VotesModule,
    UsersModule,
    BudgetModule,
    RewardsModule,
    TeamsModule,
    UserTopProjectsModule,
  ],
})
export class AppModule {}
