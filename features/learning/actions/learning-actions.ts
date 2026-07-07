'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import { awardLmsActivity, awardLmsSplitActivity } from '@/lib/lms/award-activity';
import { evaluateBadgeUnlocks } from '@/lib/lms/badge-unlock';
import { retryPendingCoreXp } from '@/lib/lms/core-xp-retry';
import {
  calculateQuizPoints,
  lmsFlashcardVisitSourceKey,
  lmsLessonCompleteSourceKey,
  lmsQuizCompletedSourceKey,
  lmsQuizCorrectSourceKey,
} from '@/lib/lms/point-rules';
import { notifyEnrollmentPending } from '@/lib/lms/notifications';
import { logEnrollmentRequested } from '@/features/admin-cms/lib/enrollment-log';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';
import {
  GAMIFICATION_REWARDS,
  resolveQuizXp,
} from '@/features/student/lib/gamification-rewards';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

const learningLog = loggers.learning;

async function requireUserId(): Promise<string> {
  return requireAuthUserWithAnchor();
}

/** Request enrollment — creates PENDING row + user anchor. */
export async function requestEnrollment(courseId: string) {
  const userId = await requireUserId();

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, type: 'COURSE', status: 'PENDING' },
    update: {},
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(userId), 'default');
  learningLog.info({ userId, courseId, status: enrollment.status }, 'Enrollment requested');
  return { enrollmentId: enrollment.id, status: enrollment.status };
}

/** Request enrollment — kursus berbayar → PENDING; gratis → ACTIVE langsung. */
export async function requestCourseEnrollment(courseSlug: string) {
  const userId = await requireUserId();

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) throw new Error('Kursus tidak ditemukan');
  if (!course.isPublished) throw new Error('Kursus belum tersedia');

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });

  if (existing?.status === 'ACTIVE') {
    return { enrollmentId: existing.id, courseSlug, status: existing.status };
  }

  const status = course.priceIdr > 0 ? 'PENDING' : 'ACTIVE';

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    create: { userId, courseId: course.id, type: 'COURSE', status },
    update: { status },
  });

  if (status === 'PENDING' && existing?.status !== 'PENDING') {
    const studentName =
      (await resolveLmsDisplayName(userId, null)) ?? 'Siswa';
    await notifyEnrollmentPending({
      enrollmentId: enrollment.id,
      studentUserId: userId,
      studentName,
      courseTitle: course.title,
    });
    await logEnrollmentRequested({
      enrollmentId: enrollment.id,
      userId,
      type: 'COURSE',
      productTitle: course.title,
      productSubtitle: course.slug,
      studentName,
    });
  }

  revalidatePath('/admin/pembayaran');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(userId), 'default');
  learningLog.info(
    { userId, courseSlug, courseId: course.id, status: enrollment.status },
    'Course enrollment requested',
  );
  return { enrollmentId: enrollment.id, courseSlug, status: enrollment.status };
}

/** @deprecated Gunakan requestCourseEnrollment — hanya untuk grant admin / seed. */
export async function enrollInCourse(courseSlug: string) {
  const userId = await requireUserId();

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) throw new Error('Kursus tidak ditemukan');
  if (!course.isPublished) throw new Error('Kursus belum tersedia');

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    create: { userId, courseId: course.id, type: 'COURSE', status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(userId), 'default');
  learningLog.info({ userId, courseSlug, courseId: course.id, status: enrollment.status }, 'Course enrollment activated');
  return { enrollmentId: enrollment.id, courseSlug, status: enrollment.status };
}

/** Mark lesson complete locally + award XP/points via Core + LMS. */
export async function markLessonComplete(
  lessonId: string,
  xpReward = GAMIFICATION_REWARDS.LESSON_COMPLETED.xp,
) {
  const userId = await requireUserId();

  const existing = await prisma.userProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (existing?.isCompleted) {
    learningLog.debug({ userId, lessonId }, 'Lesson already marked complete');
    return { alreadyCompleted: true as const };
  }

  await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, isCompleted: true },
    update: { isCompleted: true, completedAt: new Date() },
  });

  const completedCount = await prisma.userProgress.count({
    where: { userId, isCompleted: true },
  });

  await awardLmsActivity({
    userId,
    amount: GAMIFICATION_REWARDS.LESSON_COMPLETED.points,
    xpAmount: xpReward,
    coreKind: 'lesson_complete',
    pointsSourceKey: lmsLessonCompleteSourceKey(lessonId, userId),
    pointsSourceType: 'LESSON_COMPLETE',
    sourceId: lessonId,
    idempotencyKey: buildLmsIdempotencyKey('lesson_complete', userId, lessonId),
  });

  if (completedCount === 1) {
    await evaluateBadgeUnlocks(userId, { type: 'FIRST_LESSON' });
  }

  // Self-healing: re-dispatch any of this user's XP that failed to reach Core.
  await retryPendingCoreXp({ userId, limit: 10 }).catch((error) => {
    learningLog.warn({ userId, error }, 'Core XP outbox drain skipped');
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/belajar');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  revalidatePath('/dashboard/pencapaian');
  revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(userId), 'default');
  learningLog.info({ userId, lessonId, xpReward }, 'Lesson marked complete');
  return {
    success: true as const,
    xpReward,
    pointsReward: GAMIFICATION_REWARDS.LESSON_COMPLETED.points,
  };
}

/** Record flashcard tab visit — idempotent per lesson. */
export async function recordFlashcardVisit(lessonId: string) {
  const userId = await requireUserId();

  const result = await awardLmsActivity({
    userId,
    amount: GAMIFICATION_REWARDS.FLASHCARD_EXPLORED.points,
    xpAmount: GAMIFICATION_REWARDS.FLASHCARD_EXPLORED.xp,
    coreKind: 'flashcard_visit',
    pointsSourceKey: lmsFlashcardVisitSourceKey(lessonId, userId),
    pointsSourceType: 'FLASHCARD_VISIT',
    sourceId: lessonId,
    idempotencyKey: buildLmsIdempotencyKey('flashcard_visit', userId, lessonId),
  });

  if (result.pointsTotal != null) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/leaderboard');
  }

  return {
    awarded: result.pointsTotal != null,
    xpReward: result.pointsTotal != null ? GAMIFICATION_REWARDS.FLASHCARD_EXPLORED.xp : 0,
    pointsReward: result.pointsTotal != null ? GAMIFICATION_REWARDS.FLASHCARD_EXPLORED.points : 0,
  };
}

/** Simpan jawaban kuis — skor dihitung server-side. */
export async function submitQuizAnswers(input: {
  lessonId: string;
  answers: Record<string, string>;
}) {
  const userId = await requireUserId();

  const questions = await prisma.question.findMany({
    where: { lessonId: input.lessonId },
    include: { options: true },
  });

  if (questions.length === 0) {
    throw new Error('Tidak ada soal untuk lesson ini');
  }

  const attemptType = questions.some((q) => q.type === 'TRYOUT') ? 'TRYOUT' : 'QUIZ';

  let correct = 0;
  for (const question of questions) {
    const selectedId = input.answers[question.id];
    const selected = question.options.find((o) => o.id === selectedId);
    if (selected?.isCorrect) correct += 1;
  }

  const score = Math.round((correct / questions.length) * 100);
  const scored = calculateQuizPoints(correct);
  // XP flat (+ bonus skor sempurna); poin tetap skala dengan jawaban benar.
  const quizXp = resolveQuizXp(score);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      lessonId: input.lessonId,
      score,
      type: attemptType,
    },
  });

  const priorQuizAttempts = await prisma.quizAttempt.count({
    where: { userId, type: 'QUIZ', id: { not: attempt.id } },
  });

  await awardLmsSplitActivity({
    userId,
    coreKind: 'quiz_complete',
    xpAmount: quizXp,
    sourceId: attempt.id,
    idempotencyKey: buildLmsIdempotencyKey('quiz_complete', userId, input.lessonId),
    xpSourceType: 'QUIZ_PASS',
    pointEvents: [
      {
        amount: scored.base,
        pointsSourceKey: lmsQuizCompletedSourceKey(input.lessonId, userId),
        pointsSourceType: 'QUIZ_PASS',
        sourceId: input.lessonId,
      },
      ...(scored.bonus > 0
        ? [
            {
              amount: scored.bonus,
              pointsSourceKey: lmsQuizCorrectSourceKey(input.lessonId, userId),
              pointsSourceType: 'QUIZ_CORRECT' as const,
              sourceId: input.lessonId,
            },
          ]
        : []),
    ],
  });

  if (priorQuizAttempts === 0) {
    await evaluateBadgeUnlocks(userId, { type: 'FIRST_QUIZ' });
  }

  await retryPendingCoreXp({ userId, limit: 10 }).catch((error) => {
    learningLog.warn({ userId, error }, 'Core XP outbox drain skipped');
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  revalidatePath('/dashboard/pencapaian');
  revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(userId), 'default');
  learningLog.info(
    {
      userId,
      lessonId: input.lessonId,
      attemptId: attempt.id,
      score,
      correct,
      total: questions.length,
      type: attemptType,
      xpReward: quizXp,
      pointsReward: scored.total,
    },
    'Quiz submitted',
  );
  return {
    attemptId: attempt.id,
    score,
    correct,
    total: questions.length,
    xpReward: quizXp,
    pointsReward: scored.total,
  };
}

/** Save quiz attempt locally + award XP via Core. */
export async function submitQuizAttempt(input: {
  lessonId?: string | null;
  score: number;
  xpReward?: number;
  type?: 'QUIZ' | 'TRYOUT';
}) {
  const userId = await requireUserId();

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      lessonId: input.lessonId ?? null,
      score: input.score,
      type: input.type ?? 'QUIZ',
    },
  });

  if (input.lessonId && input.type !== 'TRYOUT') {
    const correctEstimate = Math.round((input.score / 100) * 10);
    const scored = calculateQuizPoints(correctEstimate);
    await awardLmsSplitActivity({
      userId,
      coreKind: 'quiz_complete',
      xpAmount: input.xpReward ?? resolveQuizXp(input.score),
      sourceId: attempt.id,
      idempotencyKey: buildLmsIdempotencyKey('quiz_complete', userId, input.lessonId),
      xpSourceType: 'QUIZ_PASS',
      pointEvents: [
        {
          amount: scored.base,
          pointsSourceKey: lmsQuizCompletedSourceKey(input.lessonId, userId),
          pointsSourceType: 'QUIZ_PASS',
          sourceId: input.lessonId,
        },
      ],
    });
  } else {
    const isTryout = input.type === 'TRYOUT';
    const xpReward =
      input.xpReward ??
      (isTryout
        ? GAMIFICATION_REWARDS.TRYOUT_COMPLETED.xp
        : GAMIFICATION_REWARDS.QUIZ_COMPLETED.xp);
    const pointsReward = isTryout
      ? GAMIFICATION_REWARDS.TRYOUT_COMPLETED.points
      : GAMIFICATION_REWARDS.QUIZ_COMPLETED.points;
    await awardLmsActivity({
      userId,
      amount: pointsReward,
      xpAmount: xpReward,
      coreKind: isTryout ? 'tryout_complete' : 'quiz_complete',
      pointsSourceKey: `quiz:${attempt.id}:${userId}`,
      pointsSourceType: isTryout ? 'TRYOUT' : 'QUIZ_PASS',
      sourceId: attempt.id,
      idempotencyKey: buildLmsIdempotencyKey(
        isTryout ? 'tryout_complete' : 'quiz_complete',
        userId,
        attempt.id,
      ),
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(userId), 'default');
  return { attemptId: attempt.id, score: attempt.score };
}
