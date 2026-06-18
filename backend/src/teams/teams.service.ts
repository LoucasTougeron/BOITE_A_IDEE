import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { AutoGenerateResult, ProposedTeam, StudentRow } from './teams.types';

export type { AutoGenerateResult, ProposedTeam };

// Points attribués selon le rang choisi par l'étudiant dans son top 3
const RANK_SCORE: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
// Points attribués pour un simple like (sans classement explicite)
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

  // ─────────────────────────────────────────────────────────────────────────
  // Génération automatique des équipes
  //
  // Deux modes selon le filtre appliqué :
  //   • Mode "affinité"  (promo sélectionnée) : les étudiants sont triés par
  //     leur projet préféré puis découpés en tranches — ceux qui partagent le
  //     même projet favori se retrouvent dans la même équipe.
  //   • Mode "équilibré" (toutes promos)      : les étudiants sont répartis en
  //     round-robin selon leur groupe (promo + spécialité) pour assurer la
  //     diversité des profils dans chaque équipe.
  // ─────────────────────────────────────────────────────────────────────────
  async autoGenerate(
    teamSize: number,
    filterPromo?: string,
    filterSpecialty?: string,
  ): Promise<AutoGenerateResult> {

    // ── Étape 1 : récupérer les étudiants correspondant aux filtres ──────────
    let studentsQuery = this.supabase.db
      .from('users')
      .select('id, first_name, last_name, email, promo, specialty')
      .eq('role', 'user');
    if (filterPromo)     studentsQuery = studentsQuery.eq('promo', filterPromo);
    if (filterSpecialty) studentsQuery = studentsQuery.eq('specialty', filterSpecialty);

    const { data: studentsData, error: studentsError } = await studentsQuery;
    if (studentsError) throw studentsError;

    const students = studentsData as StudentRow[];
    const studentIds = students.map((s) => s.id);

    // Aucun étudiant trouvé pour ces filtres → on retourne un résultat vide
    if (studentIds.length === 0) {
      return {
        teams: [],
        unassigned: [],
        stats: { totalStudents: 0, studentsWithPreferences: 0, studentsWithoutPreferences: 0, mode: filterPromo ? 'affinity' : 'balanced' },
      };
    }

    // ── Étape 2 : récupérer les préférences en parallèle ────────────────────
    // On filtre directement en base sur les IDs des étudiants concernés
    // pour éviter de rapatrier des données inutiles.
    const [topProjectsRes, likesRes] = await Promise.all([
      this.supabase.db.from('user_top_projects').select('user_id, project_id, rank').in('user_id', studentIds),
      this.supabase.db.from('votes').select('user_id, project_id').in('user_id', studentIds),
    ]);


    // ── Étape 3 : construire le vecteur de préférences de chaque étudiant ───
    // Le score reflète l'intensité de la préférence :
    //   top 1 = 3 pts, top 2 = 2 pts, top 3 = 1 pt, like seul = 0.5 pt
    const preferencesByStudent = new Map<string, Map<string, number>>(
      studentIds.map((id) => [id, new Map()]),
    );

    // Remplissage depuis le top 3 explicite
    for (const topProject of (topProjectsRes.data ?? [])) {
      preferencesByStudent
        .get(topProject.user_id)!
        .set(topProject.project_id, RANK_SCORE[topProject.rank] ?? 1);
    }

    // Remplissage depuis les likes (uniquement si le projet n'est pas déjà dans le top 3)
    for (const like of (likesRes.data ?? [])) {
      const prefs = preferencesByStudent.get(like.user_id)!;
      if (!prefs.has(like.project_id)) prefs.set(like.project_id, LIKE_SCORE);
    }

    // ── Étape 4 : précalculer le projet préféré de chaque étudiant ──────────
    // Ce projet servira de clé de tri en mode affinité.
    const favoriteProjectByStudent = new Map<string, string>(
      studentIds.map((id) => {
        const prefs = preferencesByStudent.get(id)!;
        if (prefs.size === 0) return [id, `zzz__${id}`];
        const [bestProjectId] = [...prefs.entries()].reduce((best, current) =>
          current[1] > best[1] ? current : best,
        );
        return [id, bestProjectId];
      }),
    );

    // ── Étape 5 : découper les étudiants en groupes (chunks) ────────────────
    const teamChunks: StudentRow[][] = filterPromo
      ? this.chunkByAffinity(students, teamSize, favoriteProjectByStudent)
      : this.chunkByBalance(students, teamSize);

    // ── Étape 6 : construire les équipes finales avec scores
    const proposedTeams: ProposedTeam[] = teamChunks.map((chunk, index) => ({
      name: `Équipe ${index + 1}`,

      // Pour chaque membre, on calcule son score d'affinité moyen avec les autres
      members: chunk.map((student) => {
        const studentPrefs = preferencesByStudent.get(student.id)!;
        const teammates = chunk.filter((other) => other.id !== student.id);

        const averageAffinityScore = teammates.length === 0 ? 0
          : teammates.reduce((total, teammate) => {
              const teammatePrefs = preferencesByStudent.get(teammate.id)!;
              let pairScore = 0;
              for (const [projectId, score] of studentPrefs) {
                const teammateScore = teammatePrefs.get(projectId);
                if (teammateScore !== undefined) pairScore += score + teammateScore;
              }
              return total + pairScore;
            }, 0) / teammates.length;

        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          promo: student.promo,
          specialty: student.specialty,
          affinityScore: Math.round(averageAffinityScore * 10) / 10,
        };
      }),

    }));

    const studentsWithPreferencesCount = studentIds.filter(
      (id) => preferencesByStudent.get(id)!.size > 0,
    ).length;

    return {
      teams: proposedTeams,
      unassigned: [],
      stats: {
        totalStudents: students.length,
        studentsWithPreferences: studentsWithPreferencesCount,
        studentsWithoutPreferences: students.length - studentsWithPreferencesCount,
        mode: filterPromo ? 'affinity' : 'balanced',
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Application des équipes proposées
  // Crée les nouvelles équipes en parallèle, puis affecte les membres en batch.
  // ─────────────────────────────────────────────────────────────────────────
  async autoAssign(
    proposedTeams: { name?: string; existingTeamId?: string; memberIds: string[] }[],
  ): Promise<void> {
    // Résolution des IDs : réutilisation d'une équipe existante ou création
    const teamAssignments = await Promise.all(
      proposedTeams.map(async (team) => ({
        teamId: team.existingTeamId ?? await this.createTeamAndReturnId(team.name ?? 'Équipe'),
        memberIds: team.memberIds,
      })),
    );

    // Mise à jour des utilisateurs en une requête par équipe (IN clause)
    await Promise.all(
      teamAssignments.map(({ teamId, memberIds }) =>
        this.supabase.db
          .from('users')
          .update({ team_id: teamId })
          .in('id', memberIds)
          .then(({ error }) => { if (error) throw error; }),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Méthodes privées
  // ─────────────────────────────────────────────────────────────────────────

  // Mode affinité : tri par projet favori → les étudiants avec le même projet
  // préféré se retrouvent adjacents, puis on découpe en tranches de teamSize.
  private chunkByAffinity(
    students: StudentRow[],
    teamSize: number,
    favoriteProjectByStudent: Map<string, string>,
  ): StudentRow[][] {
    const sorted = [...students].sort((a, b) =>
      favoriteProjectByStudent.get(a.id)! < favoriteProjectByStudent.get(b.id)! ? -1 : 1,
    );
    const chunks: StudentRow[][] = [];
    for (let i = 0; i < sorted.length; i += teamSize) {
      chunks.push(sorted.slice(i, i + teamSize));
    }
    return chunks;
  }

  // Mode équilibré : round-robin par groupe (promo + spécialité).
  // On distribue un étudiant de chaque groupe dans le bucket le moins rempli,
  // en commençant par les groupes les plus grands pour maximiser la diversité.
  private chunkByBalance(students: StudentRow[], teamSize: number): StudentRow[][] {
    // Regroupement par profil (promo + spécialité)
    const studentsByProfile = new Map<string, StudentRow[]>();
    for (const student of students) {
      const profileKey = `${student.promo ?? '?'}__${student.specialty ?? '?'}`;
      const group = studentsByProfile.get(profileKey) ?? [];
      group.push(student);
      studentsByProfile.set(profileKey, group);
    }

    // Création des buckets (un bucket = une future équipe)
    const numberOfTeams = Math.max(1, Math.ceil(students.length / teamSize));
    const teamBuckets: StudentRow[][] = Array.from({ length: numberOfTeams }, () => []);

    // Tri : les groupes les plus peuplés sont distribués en premier
    const sortedGroups = [...studentsByProfile.values()]
      .sort((a, b) => b.length - a.length)
      .map((group) => [...group]); // copie pour éviter de muter l'original

    // Round-robin : tant qu'il reste des étudiants à placer,
    // on prend un étudiant de chaque groupe et on le met dans le bucket le moins rempli
    let hasRemainingStudents = true;
    while (hasRemainingStudents) {
      hasRemainingStudents = false;
      for (const group of sortedGroups) {
        if (group.length === 0) continue;
        hasRemainingStudents = true;
        const smallestBucket = teamBuckets.reduce((min, bucket) =>
          bucket.length < min.length ? bucket : min, teamBuckets[0],
        );
        smallestBucket.push(group.shift()!);
      }
    }

    return teamBuckets.filter((bucket) => bucket.length > 0);
  }

  // Crée une équipe en base et retourne son ID
  private async createTeamAndReturnId(name: string): Promise<string> {
    const { data, error } = await this.supabase.db
      .from('teams').insert({ name }).select('id').single();
    if (error) throw error;
    return data.id;
  }
}
