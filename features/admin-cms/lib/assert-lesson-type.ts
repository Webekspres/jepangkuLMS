import type { LessonType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function getLessonTypeForAdmin(lessonId: string): Promise<LessonType | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { lessonType: true },
  });
  if (!lesson) throw new Error('Pelajaran tidak ditemukan.');
  return lesson.lessonType ?? null;
}

export async function assertLessonAllowsFlashcardMutation(lessonId: string): Promise<void> {
  const lessonType = await getLessonTypeForAdmin(lessonId);
  if (lessonType && lessonType !== 'FLASHCARD') {
    throw new Error('Lesson ini bukan tipe flashcard.');
  }
}

export async function assertLessonAllowsQuizMutation(lessonId: string): Promise<void> {
  const lessonType = await getLessonTypeForAdmin(lessonId);
  if (lessonType && lessonType !== 'QUIZ') {
    throw new Error('Lesson ini bukan tipe quiz.');
  }
}
