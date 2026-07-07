'use server';

import { revalidatePath } from 'next/cache';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';
import { assertLessonScope } from '@/features/admin-cms/lib/assert-lesson-scope';
import { assertLessonAllowsQuizMutation } from '@/features/admin-cms/lib/assert-lesson-type';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { lessonQuestionSchema } from '@/features/admin-cms/lib/validations';

function revalidateLessonContent(courseId: string, moduleId: string, lessonId: string) {
  revalidateStudentLearningSurfaces({ lessonId });
  revalidatePath(ADMIN_ROUTES.kursusLessonForm(courseId, moduleId));
  revalidatePath(ADMIN_ROUTES.kursusLessons(courseId, moduleId));
}

async function ensureQuizLesson(lessonId: string): Promise<CmsActionResult | null> {
  try {
    await assertLessonAllowsQuizMutation(lessonId);
    return null;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Lesson ini tidak menerima soal quiz.',
    };
  }
}

export async function createLessonQuestionAction(
  input: unknown,
): Promise<CmsActionResult & { id?: string }> {
  await requireAdminAction();
  const parsed = lessonQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertLessonScope(data.courseId, data.moduleId, data.lessonId);
  const typeError = await ensureQuizLesson(data.lessonId);
  if (typeError) return typeError;

  const correctCount = data.options.filter((opt) => opt.isCorrect).length;
  if (correctCount !== 1) {
    return { ok: false, message: 'Pilih tepat satu jawaban benar.' };
  }

  const row = await prisma.question.create({
    data: {
      lessonId: data.lessonId,
      type: 'QUIZ',
      questionText: data.questionText,
      explanation: data.explanation || null,
      // Lesson quiz XP is standardized globally via gamification SSOT.
      xpReward: 0,
      options: {
        create: data.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      },
    },
  });

  revalidateLessonContent(data.courseId, data.moduleId, data.lessonId);
  return { ok: true, id: row.id };
}

export async function updateLessonQuestionAction(
  questionId: string,
  input: unknown,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = lessonQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertLessonScope(data.courseId, data.moduleId, data.lessonId);
  const typeError = await ensureQuizLesson(data.lessonId);
  if (typeError) return typeError;

  const correctCount = data.options.filter((opt) => opt.isCorrect).length;
  if (correctCount !== 1) {
    return { ok: false, message: 'Pilih tepat satu jawaban benar.' };
  }

  const existing = await prisma.question.findFirst({
    where: { id: questionId, lessonId: data.lessonId },
  });
  if (!existing) return { ok: false, message: 'Soal tidak ditemukan.' };

  await prisma.$transaction([
    prisma.questionOption.deleteMany({ where: { questionId } }),
    prisma.question.update({
      where: { id: questionId },
      data: {
        questionText: data.questionText,
        explanation: data.explanation || null,
        // Legacy field kept in schema, but lesson quiz rewards no longer vary per question.
        xpReward: 0,
        options: {
          create: data.options.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        },
      },
    }),
  ]);

  revalidateLessonContent(data.courseId, data.moduleId, data.lessonId);
  return { ok: true };
}

export async function deleteLessonQuestionAction(
  courseId: string,
  moduleId: string,
  lessonId: string,
  questionId: string,
): Promise<CmsActionResult> {
  await requireAdminAction();
  await assertLessonScope(courseId, moduleId, lessonId);
  const typeError = await ensureQuizLesson(lessonId);
  if (typeError) return typeError;

  const existing = await prisma.question.findFirst({
    where: { id: questionId, lessonId },
  });
  if (!existing) return { ok: false, message: 'Soal tidak ditemukan.' };

  await prisma.question.delete({ where: { id: questionId } });
  revalidateLessonContent(courseId, moduleId, lessonId);
  return { ok: true };
}
