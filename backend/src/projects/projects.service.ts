import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private supabase: SupabaseService) {}

  async findAll(query: Record<string, string>) {
    let req = this.supabase.db
      .from('projects')
      .select('*, votes(count)')
      .order('created_at', { ascending: false });

    if (query.search) {
      req = req.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }
    if (query.theme) req = req.eq('theme', query.theme);
    if (query.status) req = req.eq('status', query.status);
    if (query.specialty) req = req.eq('specialty', query.specialty);
    if (query.tag) req = req.contains('tags', [query.tag]);

    const { data, error } = await req;
    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.db
      .from('projects')
      .select('*, votes(count)')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException();
    return data;
  }

  async getRandom() {
    const { data, error } = await this.supabase.db
      .from('projects')
      .select('id');
    if (error || !data?.length) throw new NotFoundException('No projects found');

    const random = data[Math.floor(Math.random() * data.length)];
    return this.findOne(random.id);
  }

  async create(dto: CreateProjectDto, userId: string) {
    const { data, error } = await this.supabase.db
      .from('projects')
      .insert({ ...dto, creator_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, dto: Partial<CreateProjectDto>, user: any) {
    const project = await this.findOne(id);
    const isAdmin = user.user_metadata?.role === 'admin';
    if (project.creator_id !== user.id && !isAdmin) throw new ForbiddenException();

    const { data, error } = await this.supabase.db
      .from('projects')
      .update(dto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase.db
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { deleted: true };
  }
}
