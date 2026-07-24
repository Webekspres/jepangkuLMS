import { PLACEMENT_PAPER } from '../data/placement-paper';
import { resolvePlacementLevel } from '../data/placement-score-bands';
import type { PlacementLevel } from '../data/types';

export function scorePlacementAnswers(answers: Record<string, string>): {
  correctCount: number;
  totalQuestions: number;
  score: number;
  recommendedLevel: PlacementLevel;
  blurb: string;
} {
  const questions = PLACEMENT_PAPER.questions;
  let correctCount = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctOptionId) correctCount += 1;
  }
  const totalQuestions = questions.length;
  const score =
    totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
  const band = resolvePlacementLevel(score);
  return {
    correctCount,
    totalQuestions,
    score,
    recommendedLevel: band.level,
    blurb: band.blurb,
  };
}
