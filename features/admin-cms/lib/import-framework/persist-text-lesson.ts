import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  NormalizedLesson,
  NormalizedTextLessonContent,
} from '@/features/admin-cms/lib/import-framework/normalized-import-types';

type Tx = Prisma.TransactionClient | PrismaClient;

export async function persistTextLesson(
  tx: Tx,
  lessonId: string,
  lesson: NormalizedLesson & { content: NormalizedTextLessonContent },
) {
  await tx.lesson.update({
    where: { id: lessonId },
    data: {
      content: lesson.content.textContent,
      videoUrl: null,
    },
  });
}
