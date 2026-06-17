import { prisma } from '@/lib/prisma';

export async function assertLessonScope(
  courseId: string,
  moduleId: string,
  lessonId: string,
): Promise<void> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, moduleId, module: { courseId } },
    select: { id: true },
  });
  if (!lesson) {
    throw new Error('Pelajaran tidak ditemukan atau tidak termasuk kursus ini.');
  }
}
