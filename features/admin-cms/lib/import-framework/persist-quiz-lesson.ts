import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  NormalizedLesson,
  NormalizedQuizLessonContent,
} from '@/features/admin-cms/lib/import-framework/normalized-import-types';

type Tx = Prisma.TransactionClient | PrismaClient;

export async function persistQuizLesson(
  tx: Tx,
  lessonId: string,
  lesson: NormalizedLesson & { content: NormalizedQuizLessonContent },
) {
  await tx.lesson.update({
    where: { id: lessonId },
    data: {
      content: null,
      videoUrl: null,
    },
  });

  for (const [questionIndex, question] of lesson.content.questions.entries()) {
    await tx.question.create({
      data: {
        lessonId,
        type: lesson.content.questionType,
        sortOrder: questionIndex + 1,
        questionText: question.prompt,
        explanation: question.explanation ?? null,
        xpReward: 0,
        options: {
          create: question.options.map((option: { text: string; isCorrect: boolean }) => ({
            text: option.text,
            isCorrect: option.isCorrect,
          })),
        },
      },
    });
  }
}
