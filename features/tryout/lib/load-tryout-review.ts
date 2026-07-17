import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';
import { TRYOUT_PASS_SCORE_PERCENT } from '@/features/student/lib/gamification-rewards';
import { buildTryoutAttemptDetails } from '@/features/tryout/lib/tryout-attempt-analysis';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';

export type TryoutReviewQuestion = {
  id: string;
  examNumber: number;
  section: string;
  sectionLabel: string;
  questionText: string;
  explanation: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
  selectedOptionId: string | null;
  isCorrect: boolean;
  correctOptionText: string | null;
  selectedOptionText: string | null;
};

export type TryoutAttemptReview = {
  attemptId: string;
  sessionTitle: string;
  sessionCode: string;
  phaseLabel: string;
  level: LevelJLPT;
  score: number;
  correct: number;
  total: number;
  pass: boolean;
  submittedAt: string;
  displayName: string;
  sectionBreakdown: {
    section: TryoutSectionValue;
    sectionLabel: string;
    correct: number;
    total: number;
  }[];
  questions: TryoutReviewQuestion[];
};

export const loadTryoutAttemptReview = cache(async function loadTryoutAttemptReview(
  attemptId: string,
): Promise<TryoutAttemptReview | null> {
  const userId = await requireAuthUserId();

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
      type: 'TRYOUT',
      tryoutSessionId: { not: null },
    },
    include: {
      tryoutSession: true,
    },
  });

  if (!attempt?.tryoutSession) return null;

  const attemptLevel = attempt.tryoutLevel ?? attempt.tryoutSession.level;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, ssoDisplayName: true },
  });

  const details = await buildTryoutAttemptDetails(attempt);
  if (!details) return null;

  const questions: TryoutReviewQuestion[] = details.questions;

  return {
    attemptId: attempt.id,
    sessionTitle: attempt.tryoutSession.title,
    sessionCode: attempt.tryoutSession.code,
    phaseLabel: attempt.tryoutSession.phaseLabel,
    level: attemptLevel,
    score: attempt.score,
    correct: attempt.correctCount ?? questions.filter((q) => q.isCorrect).length,
    total: attempt.totalQuestions ?? questions.length,
    pass: attempt.score >= TRYOUT_PASS_SCORE_PERCENT,
    submittedAt: attempt.createdAt.toISOString(),
    displayName: resolvePublicDisplayName({
      displayName: user?.displayName,
      ssoDisplayName: user?.ssoDisplayName,
    }),
    sectionBreakdown: details.sectionBreakdown,
    questions,
  };
});
