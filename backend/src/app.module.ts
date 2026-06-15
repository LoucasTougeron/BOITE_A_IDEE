import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BudgetModule } from './budget/budget.module';
import { ProjectsModule } from './projects/projects.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    ProjectsModule,
    VotesModule,
    UsersModule,
    BudgetModule,
  ],
})
export class AppModule {}
