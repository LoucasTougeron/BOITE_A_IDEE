import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { AutoGenerateResult, ProposedTeam, StudentRow } from './teams.types';

export type { AutoGenerateResult, ProposedTeam };

const RANK_SCORE: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
const LIKE_SCORE = 0.5;

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
    // ── 1. Fetch all data in parallel ───────────────────────────────────────
    let usersQuery = this.supabase.db
      .from('users').select('id, first_name, last_name, email, promo, specialty').eq('role', 'user');
    if (filterPromo) usersQuery = usersQuery.eq('promo', filterPromo);
    if (filterSpecialty) usersQuery = usersQuery.eq('specialty', filterSpecialty);

    const [usersRes, topRes, likesRes, projectsRes] = await Promise.all([
      usersQuery,
      this.supabase.db.from('user_top_projects').select('user_id, project_id, rank'),
      this.supabase.db.from('votes').select('user_id, project_id'),
      this.supabase.db.from('projects').select('id, title'),
    ]);
    if (usersRes.error) throw usersRes.error;

    const students = usersRes.data as StudentRow[];
    const studentIds = new Set(students.map((u) => u.id));
    const projectTitles = new Map<string, string>((projectsRes.data ?? []).map((p: any) => [p.id, p.title]));

    // ── 2. Build preference map: userId → Map<projectId, score> ────────────
    const prefMap = new Map<string, Map<string, number>>(students.map((u) => [u.id, new Map()]));

    for (const tp of (topRes.data ?? [])) {
      if (studentIds.has(tp.user_id))
        prefMap.get(tp.user_id)!.set(tp.project_id, RANK_SCORE[tp.rank] ?? 1);
    }
    for (const like of (likesRes.data ?? [])) {
      if (studentIds.has(like.user_id)) {
        const prefs = prefMap.get(like.user_id)!;
        if (!prefs.has(like.project_id)) prefs.set(like.project_id, LIKE_SCORE);
      }
    }

    // ── 3. Sort key per student: top project id (most weighted) ────────────
    // Students sharing the same top project end up adjacent after sort → natural grouping
    const sortKey = (u: StudentRow): string => {
      const prefs = prefMap.get(u.id)!;
      if (prefs.size === 0) return `zzz__${u.promo ?? ''}__${u.specialty ?? ''}`;
      const [topPid] = [...prefs.entries()].sort(([, a], [, b]) => b - a)[0];
      return topPid;
    };

    const sorted = [...students].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

    // ── 4. Chunk into teams of teamSize ────────────────────────────────────
    const chunks: StudentRow[][] = [];
    if (!filterPromo) {
      // Balanced: interleave by (promo, specialty) group so each chunk is diverse
      const groupMap = new Map<string, StudentRow[]>();
      for (const u of students) {
        const key = `${u.promo ?? '?'}__${u.specialty ?? '?'}`;
        const g = groupMap.get(key) ?? [];
        g.push(u);
        groupMap.set(key, g);
      }
      const groups = [...groupMap.values()].sort((a, b) => b.length - a.length);
      const numTeams = Math.max(1, Math.ceil(students.length / teamSize));
      const buckets: StudentRow[][] = Array.from({ length: numTeams }, () => []);
      const remaining = groups.map((g) => [...g]);
      let anyLeft = true;
      while (anyLeft) {
        anyLeft = false;
        for (const group of remaining) {
          if (!group.length) continue;
          anyLeft = true;
          const target = buckets.reduce((min, b) => b.length < min.length ? b : min, buckets[0]);
          target.push(group.shift()!);
        }
      }
      chunks.push(...buckets.filter((b) => b.length > 0));
    } else {
      // Affinity: chunk sorted list (students with same top project are adjacent)
      for (let i = 0; i < sorted.length; i += teamSize) {
        chunks.push(sorted.slice(i, i + teamSize));
      }
    }

    // ── 5. Build result teams ───────────────────────────────────────────────
    const teams: ProposedTeam[] = chunks.map((chunk, i) => {
      const memberIds = chunk.map((u) => u.id);
      const sharedPids = new Set<string>();
      // Shared projects = intersection of all members' preferences
      if (memberIds.length > 1) {
        const [first, ...rest] = memberIds;
        for (const pid of prefMap.get(first)!.keys()) {
          if (rest.every((id) => prefMap.get(id)!.has(pid))) sharedPids.add(pid);
        }
      }
      return {
        name: `Équipe ${i + 1}`,
        members: chunk.map((u) => {
          const others = memberIds.filter((id) => id !== u.id);
          const avgAffinity = others.length === 0 ? 0
            : others.reduce((sum, id) => {
                const pa = prefMap.get(u.id)!;
                const pb = prefMap.get(id)!;
                let s = 0;
                for (const [pid, score] of pa) if (pb.has(pid)) s += score + pb.get(pid)!;
                return sum + s;
              }, 0) / others.length;
          return {
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            promo: u.promo,
            specialty: u.specialty,
            affinityScore: Math.round(avgAffinity * 10) / 10,
          };
        }),
        sharedProjects: [...sharedPids].map((pid) => projectTitles.get(pid) ?? pid),
      };
    });

    const withPrefs = students.filter((u) => (prefMap.get(u.id)?.size ?? 0) > 0);
    return {
      teams,
      unassigned: [],
      stats: {
        totalStudents: students.length,
        studentsWithPreferences: withPrefs.length,
        studentsWithoutPreferences: students.length - withPrefs.length,
        mode: filterPromo ? 'affinity' : 'balanced',
      },
    };
  }

  async autoAssign(proposedTeams: { name?: string; existingTeamId?: string; memberIds: string[] }[]): Promise<void> {
    const assignments = await Promise.all(
      proposedTeams.map(async (p) => ({
        teamId: p.existingTeamId ?? await this.createTeamId(p.name ?? 'Équipe'),
        memberIds: p.memberIds,
      })),
    );
    await Promise.all(
      assignments.map(({ teamId, memberIds }) =>
        this.supabase.db.from('users').update({ team_id: teamId }).in('id', memberIds)
          .then(({ error }) => { if (error) throw error; }),
      ),
    );
  }

  private async createTeamId(name: string): Promise<string> {
    const { data, error } = await this.supabase.db
      .from('teams').insert({ name }).select('id').single();
    if (error) throw error;
    return data.id;
  }
}
