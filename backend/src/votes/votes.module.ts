import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { VotesController } from './votes.controller';
import { AllVotesController } from './all-votes.controller';
import { VotesService } from './votes.service';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [SupabaseModule, RewardsModule],
  controllers: [VotesController, AllVotesController],
  providers: [VotesService],
})
export class VotesModule {}
