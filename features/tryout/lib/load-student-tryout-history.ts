import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { buildJlptCefrAnalysis, type CefrLevel } from '@/features/tryout/lib/jlpt-cefr-reference';
import { buildTryoutAttemptDetails } from '@/features/tryout/lib/tryout-attempt-analysis';
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

  const items = await Promise.all(
    attempts
      .filter((row) => row.tryoutSession)
      .map(async (row) => {
        const level = row.tryoutLevel ?? row.tryoutSession!.level;
        const correct = row.correctCount ?? 0;
        const total = row.totalQuestions ?? 0;
        const details = await buildTryoutAttemptDetails(row);
        const analysis = details
          ? buildJlptCefrAnalysis({
              level,
              correct,
              total,
              sectionBreakdown: details.sectionBreakdown,
            })
          : null;

        return {
          attemptId: row.id,
          sessionTitle: row.tryoutSession!.title,
          sessionCode: row.tryoutSession!.code,
          phaseLabel: row.tryoutSession!.phaseLabel,
          level,
          score: row.score,
          correct,
          total,
          passed: analysis?.jlptPassOverall ?? false,
          scaledJlptScore: analysis?.scaledTotalScore ?? 0,
          indicatedCefr: analysis?.indicatedCefr ?? null,
          submittedAt: row.createdAt.toISOString(),
        };
      }),
  );

  return items;
});
