'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import { awardLmsXp, isCoreAwardConfigured } from '@/lib/core/gamification';
import { prisma } from '@/lib/prisma';

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  await syncUserAnchor(userId);
  return userId;
}

/** Request enrollment — creates PENDING row + user anchor. */
export async function requestEnrollment(courseId: string) {
  const userId = await requireUserId();

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, status: 'PENDING' },
    update: {},
  });

  revalidatePath('/dashboard');
  return { enrollmentId: enrollment.id, status: enrollment.status };
}

/** Mark lesson complete locally + award XP via Core. */
export async function markLessonComplete(lessonId: string, xpReward = 10) {
  const userId = await requireUserId();

  const existing = await prisma.userProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (existing?.isCompleted) {
    return { alreadyCompleted: true as const };
  }

  await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, isCompleted: true },
    update: { isCompleted: true, completedAt: new Date() },
  });

  if (isCoreAwardConfigured()) {
    await awardLmsXp({
      userId,
      kind: 'lesson_complete',
      xpGained: xpReward,
      sourceRefId: lessonId,
      idempotencyKey: buildLmsIdempotencyKey('lesson_complete', userId, lessonId),
    });
  }

  revalidatePath('/dashboard');
  return { success: true as const };
}

/** Save quiz attempt locally + award XP via Core. */
export async function submitQuizAttempt(input: {
  lessonId?: string | null;
  score: number;
  xpReward?: number;
  type?: 'QUIZ' | 'TRYOUT';
}) {
  const userId = await requireUserId();
  const xpReward = input.xpReward ?? 10;

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      lessonId: input.lessonId ?? null,
      score: input.score,
      type: input.type ?? 'QUIZ',
    },
  });

  if (isCoreAwardConfigured()) {
    await awardLmsXp({
      userId,
      kind: 'quiz_complete',
      xpGained: xpReward,
      sourceRefId: attempt.id,
      idempotencyKey: buildLmsIdempotencyKey('quiz_complete', userId, attempt.id),
    });
  }

  revalidatePath('/dashboard');
  return { attemptId: attempt.id, score: attempt.score };
}
