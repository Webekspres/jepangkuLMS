import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { TRYOUT_PASS_SCORE_PERCENT } from '@/features/student/lib/gamification-rewards';
import {
  resolveIndicatedCefr,
  scaleToJlptTotalScore,
  type CefrLevel,
} from '@/features/tryout/lib/jlpt-cefr-reference';
import { prisma } from '@/lib/prisma';

export type StudentTryoutHistoryItem = {
  attemptId: string;
  sessionTitle: string;
  sessionCode: string;
  phaseLabel: string | null;
  level: LevelJLPT;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  scaledJlptScore: number;
  indicatedCefr: CefrLevel | null;
  submittedAt: string;
};

export const loadStudentTryoutHistory = cache(async function loadStudentTryoutHistory(): Promise<
  StudentTryoutHistoryItem[]
> {
  const userId = await requireAuthUserId();

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      type: 'TRYOUT',
      tryoutSessionId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      tryoutSession: {
        select: { title: true, code: true, phaseLabel: true, level: true },
      },
    },
  });

  return attempts
    .filter((row) => row.tryoutSession)
    .map((row) => {
      const level = row.tryoutLevel ?? row.tryoutSession!.level;
      const correct = row.correctCount ?? 0;
      const total = row.totalQuestions ?? 0;
      const scaledJlptScore = scaleToJlptTotalScore(correct, total);
      const { cefr } = resolveIndicatedCefr(level, scaledJlptScore);

      return {
        attemptId: row.id,
        sessionTitle: row.tryoutSession!.title,
        sessionCode: row.tryoutSession!.code,
        phaseLabel: row.tryoutSession!.phaseLabel,
        level,
        score: row.score,
        correct,
        total,
        passed: row.score >= TRYOUT_PASS_SCORE_PERCENT,
        scaledJlptScore,
        indicatedCefr: cefr,
        submittedAt: row.createdAt.toISOString(),
      };
    });
});
