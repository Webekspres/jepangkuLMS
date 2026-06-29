'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import { awardLmsActivity, awardLmsSplitActivity } from '@/lib/lms/award-activity';
import { evaluateBadgeUnlocks } from '@/lib/lms/badge-unlock';
import {
  calculateQuizPoints,
  LMS_POINTS,
  lmsFlashcardVisitSourceKey,
  lmsLessonCompleteSourceKey,
  lmsQuizCompletedSourceKey,
  lmsQuizCorrectSourceKey,
} from '@/lib/lms/point-rules';
import { notifyEnrollmentPending } from '@/lib/lms/notifications';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';
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
  updateTag(LEARNING_CACHE_TAGS.userEnrollments(userId));
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
  }

  revalidatePath('/admin/pembayaran');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  updateTag(LEARNING_CACHE_TAGS.userEnrollments(userId));
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
  updateTag(LEARNING_CACHE_TAGS.userEnrollments(userId));
  learningLog.info({ userId, courseSlug, courseId: course.id, status: enrollment.status }, 'Course enrollment activated');
  return { enrollmentId: enrollment.id, courseSlug, status: enrollment.status };
}

/** Mark lesson complete locally + award XP/points via Core + LMS. */
export async function markLessonComplete(lessonId: string, xpReward = LMS_POINTS.LESSON_COMPLETE) {
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
    amount: LMS_POINTS.LESSON_COMPLETE,
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

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/belajar');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  revalidatePath('/dashboard/pencapaian');
  updateTag(LEARNING_CACHE_TAGS.userEnrollments(userId));
  learningLog.info({ userId, lessonId, xpReward }, 'Lesson marked complete');
  return { success: true as const };
}

/** Record flashcard tab visit — idempotent per lesson. */
export async function recordFlashcardVisit(lessonId: string) {
  const userId = await requireUserId();

  const result = await awardLmsActivity({
    userId,
    amount: LMS_POINTS.FLASHCARD_VISIT,
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

  return { awarded: result.pointsTotal != null };
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
    xpAmount: scored.total,
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

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  revalidatePath('/dashboard/pencapaian');
  updateTag(LEARNING_CACHE_TAGS.userEnrollments(userId));
  learningLog.info(
    {
      userId,
      lessonId: input.lessonId,
      attemptId: attempt.id,
      score,
      correct,
      total: questions.length,
      type: attemptType,
      xpReward: scored.total,
    },
    'Quiz submitted',
  );
  return {
    attemptId: attempt.id,
    score,
    correct,
    total: questions.length,
    xpReward: scored.total,
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
      xpAmount: input.xpReward ?? scored.total,
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
    const xpReward = input.xpReward ?? LMS_POINTS.QUIZ_BASE;
    await awardLmsActivity({
      userId,
      amount: xpReward,
      coreKind: input.type === 'TRYOUT' ? 'tryout_complete' : 'quiz_complete',
      pointsSourceKey: `quiz:${attempt.id}:${userId}`,
      pointsSourceType: input.type === 'TRYOUT' ? 'TRYOUT' : 'QUIZ_PASS',
      sourceId: attempt.id,
      idempotencyKey: buildLmsIdempotencyKey(
        input.type === 'TRYOUT' ? 'tryout_complete' : 'quiz_complete',
        userId,
        attempt.id,
      ),
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  updateTag(LEARNING_CACHE_TAGS.userEnrollments(userId));
  return { attemptId: attempt.id, score: attempt.score };
}
