import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService } from '../supabase/supabase.service';

interface ScoreResult {
  ai_score: number;
  completeness_score: number;
  score_reasoning: string;
  final_score: number;
}

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);
  private readonly genAI: GoogleGenerativeAI | null;

  constructor(private readonly supabase: SupabaseService) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    if (!apiKey) this.logger.warn('GEMINI_API_KEY not set — AI scoring disabled');
  }

  computeCompletenessScore(project: any): number {
    let score = 0;
    if ((project.description ?? '').length > 50) score += 20;
    if ((project.objective ?? '').length > 30) score += 20;
    const tagCount = (project.tags ?? []).length;
    if (tagCount >= 1) score += 20;
    if (tagCount >= 3) score += 10;
    if (project.link) score += 15;
    if (project.specialty) score += 15;
    return Math.min(100, score);
  }

  computeVoteScore(voteCount: number): number {
    return Math.min(100, Math.round((voteCount / 20) * 100));
  }

  computeFinalScore(aiScore: number, completenessScore: number, voteCount: number): number {
    const voteScore = this.computeVoteScore(voteCount);
    return Math.round(0.45 * aiScore + 0.35 * voteScore + 0.20 * completenessScore);
  }

  private async callGemini(project: any): Promise<{ score: number; reasoning: string }> {
    if (!this.genAI) return { score: 50, reasoning: 'Score par défaut (clé API non configurée).' };

    const model = this.genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const prompt = `Tu es un évaluateur de projets innovants. Note la qualité, la clarté et le potentiel d'innovation de cette idée de projet.

Projet :
- Titre : ${project.title}
- Thème : ${project.theme}
- Description : ${project.description}
- Objectif : ${project.objective}
- Tags : ${(project.tags ?? []).join(', ') || 'aucun'}
- Statut : ${project.status}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown) :
{"score": <entier entre 0 et 100>, "reasoning": "<1 à 2 phrases en français expliquant le score>"}

Critères :
- 0-30 : Idée vague, peu développée
- 31-60 : Idée correcte, description basique
- 61-80 : Bonne idée, bien décrite avec un objectif clair
- 81-100 : Excellente idée, innovante, très bien articulée`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = /\{[\s\S]*\}/.exec(text);
    if (!jsonMatch) throw new Error(`Unexpected Gemini response: ${text}`);

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.min(100, Math.max(0, Math.round(Number(parsed.score)))),
      reasoning: String(parsed.reasoning),
    };
  }

  async scoreProject(project: any): Promise<ScoreResult> {
    const completenessScore = this.computeCompletenessScore(project);

    let aiScore = 50;
    let reasoning = 'Score par défaut.';

    try {
      const geminiResult = await this.callGemini(project);
      aiScore = geminiResult.score;
      reasoning = geminiResult.reasoning;
    } catch (err) {
      this.logger.error(`Gemini scoring failed for project ${project.id}: ${err}`);
    }

    const voteCount = project.votes?.[0]?.count ?? 0;
    const finalScore = this.computeFinalScore(aiScore, completenessScore, voteCount);

    return { ai_score: aiScore, completeness_score: completenessScore, score_reasoning: reasoning, final_score: finalScore };
  }

  async scoreAndUpdate(project: any): Promise<void> {
    try {
      const scores = await this.scoreProject(project);
      await this.supabase.db
        .from('projects')
        .update({
          ai_score: scores.ai_score,
          completeness_score: scores.completeness_score,
          score_reasoning: scores.score_reasoning,
          score_updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);
      this.logger.log(`Scored project ${project.id}: final=${scores.final_score}`);
    } catch (err) {
      this.logger.error(`Failed to score and update project ${project.id}: ${err}`);
    }
  }

  enrichWithFinalScore(project: any): any {
    const aiScore = project.ai_score ?? 0;
    const completenessScore = project.completeness_score ?? 0;
    const voteCount = project.votes?.[0]?.count ?? 0;
    return {
      ...project,
      final_score: this.computeFinalScore(aiScore, completenessScore, voteCount),
    };
  }
}
