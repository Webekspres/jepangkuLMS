import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  NormalizedLesson,
  NormalizedVideoLessonContent,
} from '@/features/admin-cms/lib/import-framework/normalized-import-types';

type Tx = Prisma.TransactionClient | PrismaClient;

export async function persistVideoLesson(
  tx: Tx,
  lessonId: string,
  lesson: NormalizedLesson & { content: NormalizedVideoLessonContent },
) {
  await tx.lesson.update({
    where: { id: lessonId },
    data: {
      content: lesson.content.textContent ?? null,
      videoUrl: lesson.content.videoUrl,
    },
  });
}
