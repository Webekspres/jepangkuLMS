'use server';

import { revalidatePath } from 'next/cache';
import type { LevelJLPT } from '@prisma/client';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import { awardLmsSplitActivity } from '@/lib/lms/award-activity';
import { evaluateBadgeUnlocks } from '@/lib/lms/badge-unlock';
import {
  calculateTryoutPoints,
  lmsTryoutCompletedSourceKey,
  lmsTryoutCorrectSourceKey,
} from '@/lib/lms/point-rules';
import { sortTryoutExamQuestions } from '@/features/admin-cms/lib/tryout-sections';
import { evaluateTryoutAccess } from '@/features/tryout/lib/tryout-access';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

const tryoutLog = loggers.learning.child({ module: 'tryout' });

export type TryoutSubmitResult =
  | {
      ok: true;
      attemptId: string;
      score: number;
      correct: number;
      total: number;
      pointsReward: number;
      pass: boolean;
    }
  | { ok: false; message: string };

export async function submitTryoutAttempt(input: {
  sessionCode: string;
  level: LevelJLPT;
  answers: Record<string, string>;
}): Promise<TryoutSubmitResult> {
  const userId = await requireAuthUserWithAnchor();

  const session = await prisma.tryoutSession.findUnique({
    where: { code: input.sessionCode, isActive: true },
  });

  if (!session) {
    return { ok: false, message: 'Sesi tryout tidak ditemukan.' };
  }

  // Gerbang akses: strict = harus dalam jendela jadwal; open practice = bebas.
  const access = evaluateTryoutAccess({
    isStrictTimeBound: session.isStrictTimeBound,
    scheduledAt: session.scheduledAt,
    timeLimitMinutes: session.timeLimitMinutes,
  });
  if (!access.ok) {
    return { ok: false, message: access.message };
  }

  const rows = await prisma.question.findMany({
    where: {
      type: 'TRYOUT',
      tryoutSessionId: session.id,
      tryoutLevel: input.level,
    },
    include: { options: true },
  });

  const questions = sortTryoutExamQuestions(
    rows.map((q) => ({
      ...q,
      section: q.tryoutSection ?? 'MOJI_GOI',
    })),
  );

  if (questions.length === 0) {
    return { ok: false, message: 'Soal untuk sesi ini belum tersedia.' };
  }

  let correct = 0;
  for (const question of questions) {
    const selectedId = input.answers[question.id];
    const selected = question.options.find((option) => option.id === selectedId);
    if (selected?.isCorrect) correct += 1;
  }

  const score = Math.round((correct / questions.length) * 100);
  const scored = calculateTryoutPoints(correct);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      lessonId: null,
      score,
      type: 'TRYOUT',
      tryoutSessionId: session.id,
      tryoutLevel: input.level,
      correctCount: correct,
      totalQuestions: questions.length,
      answersJson: JSON.stringify(input.answers),
    },
  });

  await awardLmsSplitActivity({
    userId,
    coreKind: 'tryout_complete',
    xpAmount: scored.total,
    sourceId: attempt.id,
    idempotencyKey: buildLmsIdempotencyKey(
      'tryout_complete',
      userId,
      `${session.code}:${input.level}`,
    ),
    xpSourceType: 'TRYOUT',
    pointEvents: [
      {
        amount: scored.base,
        pointsSourceKey: lmsTryoutCompletedSourceKey(session.code, input.level, userId),
        pointsSourceType: 'TRYOUT',
        sourceId: attempt.id,
      },
      ...(scored.bonus > 0
        ? [
            {
              amount: scored.bonus,
              pointsSourceKey: lmsTryoutCorrectSourceKey(session.code, input.level, userId),
              pointsSourceType: 'TRYOUT_CORRECT' as const,
              sourceId: attempt.id,
            },
          ]
        : []),
    ],
  });

  await evaluateBadgeUnlocks(userId, { type: 'TRYOUT_PASS', score });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/tryout');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/pencapaian');

  tryoutLog.info(
    { userId, sessionCode: session.code, level: input.level, score, correct },
    'Tryout submitted',
  );

  return {
    ok: true,
    attemptId: attempt.id,
    score,
    correct,
    total: questions.length,
    pointsReward: scored.total,
    pass: score >= 60,
  };
}
