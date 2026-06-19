'use server';

import { revalidatePath } from 'next/cache';
import type { LevelJLPT } from '@prisma/client';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { awardLmsPoints } from '@/lib/lms/points';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

const tryoutLog = loggers.learning.child({ module: 'tryout' });

export async function submitTryoutAttempt(input: {
  sessionCode: string;
  level: LevelJLPT;
  answers: Record<string, string>;
}) {
  const userId = await requireAuthUserWithAnchor();

  const session = await prisma.tryoutSession.findUnique({
    where: { code: input.sessionCode, isActive: true },
  });

  if (!session) {
    return { ok: false as const, message: 'Sesi tryout tidak ditemukan.' };
  }

  const questions = await prisma.question.findMany({
    where: {
      type: 'TRYOUT',
      tryoutSessionId: session.id,
      tryoutLevel: input.level,
    },
    include: { options: true },
    orderBy: { sortOrder: 'asc' },
  });

  if (questions.length === 0) {
    return { ok: false as const, message: 'Soal untuk sesi ini belum tersedia.' };
  }

  let correct = 0;
  for (const question of questions) {
    const selectedId = input.answers[question.id];
    const selected = question.options.find((option) => option.id === selectedId);
    if (selected?.isCorrect) correct += 1;
  }

  const score = Math.round((correct / questions.length) * 100);
  const pointsReward = Math.max(10, correct * 5);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      lessonId: null,
      score,
      type: 'TRYOUT',
    },
  });

  await awardLmsPoints({
    userId,
    pointsGained: pointsReward,
    sourceKey: `tryout:${session.code}:${input.level}:${attempt.id}`,
    sourceType: 'TRYOUT',
    sourceId: attempt.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/tryout');
  revalidatePath('/dashboard/leaderboard');

  tryoutLog.info(
    { userId, sessionCode: session.code, level: input.level, score, correct },
    'Tryout submitted',
  );

  return {
    ok: true as const,
    attemptId: attempt.id,
    score,
    correct,
    total: questions.length,
    pointsReward,
    pass: score >= 60,
  };
}
