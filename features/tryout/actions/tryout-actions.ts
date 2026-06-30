'use server';

import { revalidatePath } from 'next/cache';
import { updateTag } from 'next/cache';
import type { LevelJLPT } from '@prisma/client';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import { awardLmsSplitActivity } from '@/lib/lms/award-activity';
import { evaluateBadgeUnlocks } from '@/lib/lms/badge-unlock';
import { notifyEnrollmentPending } from '@/lib/lms/notifications';
import {
  calculateTryoutPoints,
  lmsTryoutCompletedSourceKey,
  lmsTryoutCorrectSourceKey,
} from '@/lib/lms/point-rules';
import { ensureTryoutEnrollmentAccess } from '@/lib/lms/tryout-enrollment';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';
import {
  resolveTryoutXp,
  TRYOUT_PASS_SCORE_PERCENT,
} from '@/features/student/lib/gamification-rewards';
import { sortTryoutExamQuestions } from '@/features/admin-cms/lib/tryout-sections';
import { evaluateTryoutAccess } from '@/features/tryout/lib/tryout-access';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
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

/** Request enrollment for a paid tryout session (PENDING) or instant ACTIVE when free. */
export async function requestTryoutEnrollment(sessionCode: string) {
  const userId = await requireAuthUserWithAnchor();

  const session = await prisma.tryoutSession.findUnique({
    where: { code: sessionCode, isActive: true },
  });
  if (!session) throw new Error('Sesi tryout tidak ditemukan');

  const existing = await prisma.enrollment.findUnique({
    where: { userId_tryoutSessionId: { userId, tryoutSessionId: session.id } },
  });

  if (existing?.status === 'ACTIVE') {
    return { enrollmentId: existing.id, sessionCode, status: existing.status };
  }

  const status = session.priceIdr > 0 ? 'PENDING' : 'ACTIVE';

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_tryoutSessionId: { userId, tryoutSessionId: session.id } },
    create: {
      userId,
      tryoutSessionId: session.id,
      type: 'TRYOUT',
      status,
    },
    update: { status, type: 'TRYOUT' },
  });

  if (status === 'PENDING' && existing?.status !== 'PENDING') {
    const studentName = (await resolveLmsDisplayName(userId, null)) ?? 'Siswa';
    await notifyEnrollmentPending({
      enrollmentId: enrollment.id,
      studentUserId: userId,
      studentName,
      courseTitle: `${session.title} (${session.level})`,
    });
  }

  revalidatePath('/admin/pembayaran');
  revalidatePath('/dashboard/tryout');
  updateTag(LEARNING_CACHE_TAGS.userEnrollments(userId));

  return { enrollmentId: enrollment.id, sessionCode, status: enrollment.status };
}

export async function submitTryoutAttempt(input: {
  sessionCode: string;
  answers: Record<string, string>;
}): Promise<TryoutSubmitResult> {
  const userId = await requireAuthUserWithAnchor();

  const session = await prisma.tryoutSession.findUnique({
    where: { code: input.sessionCode, isActive: true },
  });

  if (!session) {
    return { ok: false, message: 'Sesi tryout tidak ditemukan.' };
  }

  const enrollment = await ensureTryoutEnrollmentAccess(userId, session);
  if (!enrollment.ok) {
    return { ok: false, message: enrollment.message };
  }

  const access = evaluateTryoutAccess({
    isStrictTimeBound: session.isStrictTimeBound,
    scheduledAt: session.scheduledAt,
    timeLimitMinutes: session.timeLimitMinutes,
  });
  if (!access.ok) {
    return { ok: false, message: access.message };
  }

  const level: LevelJLPT = session.level;

  const rows = await prisma.question.findMany({
    where: {
      type: 'TRYOUT',
      tryoutSessionId: session.id,
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
  const tryoutXp = resolveTryoutXp(score);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      lessonId: null,
      score,
      type: 'TRYOUT',
      tryoutSessionId: session.id,
      tryoutLevel: level,
      correctCount: correct,
      totalQuestions: questions.length,
      answersJson: JSON.stringify(input.answers),
    },
  });

  await awardLmsSplitActivity({
    userId,
    coreKind: 'tryout_complete',
    xpAmount: tryoutXp,
    sourceId: attempt.id,
    idempotencyKey: buildLmsIdempotencyKey(
      'tryout_complete',
      userId,
      `${session.code}:${level}`,
    ),
    xpSourceType: 'TRYOUT',
    pointEvents: [
      {
        amount: scored.base,
        pointsSourceKey: lmsTryoutCompletedSourceKey(session.code, level, userId),
        pointsSourceType: 'TRYOUT',
        sourceId: attempt.id,
      },
      ...(scored.bonus > 0
        ? [
            {
              amount: scored.bonus,
              pointsSourceKey: lmsTryoutCorrectSourceKey(session.code, level, userId),
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
    { userId, sessionCode: session.code, level, score, correct },
    'Tryout submitted',
  );

  return {
    ok: true,
    attemptId: attempt.id,
    score,
    correct,
    total: questions.length,
    pointsReward: scored.total,
    pass: score >= TRYOUT_PASS_SCORE_PERCENT,
  };
}
