'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import { awardLmsXp, isCoreAwardConfigured } from '@/lib/core/gamification';
import { awardLmsPoints } from '@/lib/lms/points';
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
    create: { userId, courseId, status: 'PENDING' },
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

/** Enroll langsung (ACTIVE) untuk kursus published — MVP tanpa payment gateway. */
export async function enrollInCourse(courseSlug: string) {
  const userId = await requireUserId();

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) throw new Error('Kursus tidak ditemukan');
  if (!course.isPublished) throw new Error('Kursus belum tersedia');

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    create: { userId, courseId: course.id, status: 'ACTIVE' },
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

/** Mark lesson complete locally + award XP via Core. */
export async function markLessonComplete(lessonId: string, xpReward = 10) {
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

  if (isCoreAwardConfigured()) {
    await awardLmsXp({
      userId,
      kind: 'lesson_complete',
      xpGained: xpReward,
      sourceRefId: lessonId,
      idempotencyKey: buildLmsIdempotencyKey('lesson_complete', userId, lessonId),
    });
  }

  await awardLmsPoints({
    userId,
    pointsGained: xpReward,
    sourceKey: `lesson:${lessonId}`,
    sourceType: 'LESSON_COMPLETE',
    sourceId: lessonId,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/belajar');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  updateTag(LEARNING_CACHE_TAGS.userEnrollments(userId));
  learningLog.info({ userId, lessonId, xpReward }, 'Lesson marked complete');
  return { success: true as const };
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
  const xpReward = Math.max(10, correct * 5);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      lessonId: input.lessonId,
      score,
      type: attemptType,
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

  await awardLmsPoints({
    userId,
    pointsGained: xpReward,
    sourceKey: `quiz:${attempt.id}`,
    sourceType: 'QUIZ_PASS',
    sourceId: attempt.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
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
      xpReward,
    },
    'Quiz submitted',
  );
  return {
    attemptId: attempt.id,
    score,
    correct,
    total: questions.length,
    xpReward,
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

  await awardLmsPoints({
    userId,
    pointsGained: xpReward,
    sourceKey: `quiz:${attempt.id}`,
    sourceType: input.type === 'TRYOUT' ? 'TRYOUT' : 'QUIZ_PASS',
    sourceId: attempt.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus');
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/profil');
  updateTag(LEARNING_CACHE_TAGS.userEnrollments(userId));
  return { attemptId: attempt.id, score: attempt.score };
}
