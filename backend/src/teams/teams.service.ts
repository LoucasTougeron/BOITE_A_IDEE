import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { AutoGenerateResult, ProposedTeam, StudentRow } from './teams.types';

/** Score d'une préférence selon sa source : top 1/2/3 ou simple like. */
const RANK_SCORE: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
const LIKE_SCORE = 0.5;

/** Préférences par étudiant : id étudiant -> (id projet -> score). */
type Preferences = Map<string, Map<string, number>>;

@Injectable()
export class TeamsService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase.db
      .from('teams').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async create(name: string, _userId: string) {
    const { data, error } = await this.supabase.db
      .from('teams').insert({ name }).select().single();
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { data, error } = await this.supabase.db
      .from('teams').delete().eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async autoGenerate(teamSize: number, filterPromo?: string, filterSpecialty?: string): Promise<AutoGenerateResult> {
    const students = await this.fetchStudents(filterPromo, filterSpecialty);
    // Filtrer sur une promo => on regroupe par affinité, sinon on équilibre les profils.
    const mode = filterPromo ? 'affinity' : 'balanced';

    if (students.length === 0) {
      return { teams: [], stats: { totalStudents: 0, studentsWithPreferences: 0, studentsWithoutPreferences: 0, mode } };
    }

    const prefs = await this.loadPreferences(students.map((s) => s.id));

    const chunks = mode === 'affinity'
      ? this.chunkByAffinity(students, teamSize, prefs)
      : this.chunkByBalance(students, teamSize);

    const teams: ProposedTeam[] = chunks.map((members, i) => ({
      name: `Équipe ${i + 1}`,
      members: members.map((s) => ({ ...s, affinityScore: this.affinityScore(s, members, prefs) })),
    }));

    const withPrefs = students.filter((s) => prefs.get(s.id)!.size > 0).length;

    return {
      teams,
      stats: { totalStudents: students.length, studentsWithPreferences: withPrefs, studentsWithoutPreferences: students.length - withPrefs, mode },
    };
  }

  async autoAssign(teams: { name?: string; existingTeamId?: string; memberIds: string[] }[]): Promise<void> {
    const assignments = await Promise.all(
      teams.map(async (t) => ({
        teamId: t.existingTeamId ?? await this.createTeamAndReturnId(t.name ?? 'Équipe'),
        memberIds: t.memberIds,
      })),
    );

    await Promise.all(
      assignments.map(({ teamId, memberIds }) =>
        this.supabase.db.from('users').update({ team_id: teamId }).in('id', memberIds)
          .then(({ error }) => { if (error) throw error; }),
      ),
    );
  }

  /** Étudiants éligibles, filtrés optionnellement par promo / spécialité. */
  private async fetchStudents(filterPromo?: string, filterSpecialty?: string): Promise<StudentRow[]> {
    let query = this.supabase.db
      .from('users')
      .select('id, first_name, last_name, email, promo, specialty')
      .eq('role', 'user');
    if (filterPromo)     query = query.eq('promo', filterPromo);
    if (filterSpecialty) query = query.eq('specialty', filterSpecialty);

    const { data, error } = await query;
    if (error) throw error;
    return data as StudentRow[];
  }

  /** Construit la table des préférences : tops (pondérés par rang) puis likes. */
  private async loadPreferences(studentIds: string[]): Promise<Preferences> {
    const [tops, likes] = await Promise.all([
      this.supabase.db.from('user_top_projects').select('user_id, project_id, rank').in('user_id', studentIds),
      this.supabase.db.from('votes').select('user_id, project_id').in('user_id', studentIds),
    ]);

    const prefs: Preferences = new Map(studentIds.map((id) => [id, new Map()]));

    for (const { user_id, project_id, rank } of tops.data ?? []) {
      prefs.get(user_id)!.set(project_id, RANK_SCORE[rank] ?? 1);
    }
    for (const { user_id, project_id } of likes.data ?? []) {
      const p = prefs.get(user_id)!;
      if (!p.has(project_id)) p.set(project_id, LIKE_SCORE);
    }

    return prefs;
  }

  /** Affinité moyenne d'un étudiant avec ses coéquipiers (projets en commun). */
  private affinityScore(student: StudentRow, team: StudentRow[], prefs: Preferences): number {
    const mine = prefs.get(student.id)!;
    const teammates = team.filter((t) => t.id !== student.id);
    if (teammates.length === 0) return 0;

    const total = teammates.reduce((sum, t) => {
      const theirs = prefs.get(t.id)!;
      let shared = 0;
      for (const [projectId, value] of mine) {
        const theirValue = theirs.get(projectId);
        if (theirValue !== undefined) shared += value + theirValue;
      }
      return sum + shared;
    }, 0);

    return Math.round((total / teammates.length) * 10) / 10;
  }

  /** Projet préféré (score le plus élevé), ou null si aucune préférence. */
  private topPreference(prefs: Map<string, number>): string | null {
    let best: string | null = null;
    let bestValue = -Infinity;
    for (const [projectId, value] of prefs) {
      if (value > bestValue) { bestValue = value; best = projectId; }
    }
    return best;
  }

  /** Regroupe les étudiants partageant le même projet préféré (sans préférence => en fin). */
  private chunkByAffinity(students: StudentRow[], teamSize: number, prefs: Preferences): StudentRow[][] {
    const key = new Map(students.map((s) => [s.id, this.topPreference(prefs.get(s.id)!) ?? `~${s.id}`]));
    const sorted = [...students].sort((a, b) => {
      const ka = key.get(a.id)!, kb = key.get(b.id)!;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
    return this.chunk(sorted, teamSize);
  }

  /** Répartit les profils (promo + spécialité) de façon équilibrée entre les équipes. */
  private chunkByBalance(students: StudentRow[], teamSize: number): StudentRow[][] {
    const byProfile = new Map<string, StudentRow[]>();
    for (const s of students) {
      const key = `${s.promo ?? '?'}__${s.specialty ?? '?'}`;
      const group = byProfile.get(key) ?? [];
      group.push(s);
      byProfile.set(key, group);
    }

    const teamCount = Math.max(1, Math.ceil(students.length / teamSize));
    const buckets: StudentRow[][] = Array.from({ length: teamCount }, () => []);

    // Distribue les plus gros profils d'abord, chacun vers l'équipe la moins remplie.
    const groups = [...byProfile.values()].sort((a, b) => b.length - a.length).map((g) => [...g]);
    for (let placed = true; placed; ) {
      placed = false;
      for (const group of groups) {
        const student = group.shift();
        if (!student) continue;
        placed = true;
        buckets.reduce((min, b) => b.length < min.length ? b : min).push(student);
      }
    }

    return buckets.filter((b) => b.length > 0);
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    return chunks;
  }

  private async createTeamAndReturnId(name: string): Promise<string> {
    const { data, error } = await this.supabase.db.from('teams').insert({ name }).select('id').single();
    if (error) throw error;
    return data.id;
  }
}
