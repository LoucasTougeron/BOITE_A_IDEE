import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { VotesController } from './votes.controller';
import { AllVotesController } from './all-votes.controller';
import { VotesService } from './votes.service';

@Module({
  imports: [SupabaseModule],
  controllers: [VotesController, AllVotesController],
  providers: [VotesService],
})
export class VotesModule {}
