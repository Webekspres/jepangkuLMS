/**
 * Impor silabus Course → Module → Lesson dari JSON (format AI / Admin CMS).
 * Material & quiz diisi terpisah atau pada iterasi berikutnya.
 */
import type { PrismaClient, LevelJLPT } from '@prisma/client';
import { z } from 'zod';

const flashcardSchema = z.object({
  kosakata: z.string(),
  furigana: z.string().optional(),
  romaji: z.string().optional(),
  arti: z.string(),
  contohKalimat: z.string().optional(),
});

const questionOptionSchema = z.object({
  text: z.string(),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  questionText: z.string(),
  explanation: z.string().optional(),
  options: z.array(questionOptionSchema).min(2),
});

const lessonSchema = z.object({
  title: z.string(),
  slug: z.string(),
  order: z.number().int().positive(),
  videoUrl: z.string().url().nullable().optional(),
  flashcards: z.array(flashcardSchema).default([]),
  questions: z.array(questionSchema).default([]),
});

const moduleSchema = z.object({
  title: z.string(),
  order: z.number().int().positive(),
  lessons: z.array(lessonSchema).min(1),
});

export const courseSyllabusTreeSchema = z.object({
  course: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']),
    modules: z.array(moduleSchema).min(1),
  }),
});

export type CourseSyllabusTree = z.infer<typeof courseSyllabusTreeSchema>;

function moduleSlugFromTitle(title: string, order: number): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `modul-${order}`;
}

export type ImportSyllabusTreeResult = {
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  kosakataRows: number;
  questionCount: number;
};

export async function importCourseSyllabusTree(
  prisma: PrismaClient,
  input: CourseSyllabusTree,
  options: { isPublished?: boolean } = {},
): Promise<ImportSyllabusTreeResult> {
  const parsed = courseSyllabusTreeSchema.parse(input);
  const { course: data } = parsed;

  const course = await prisma.course.upsert({
    where: { slug: data.slug },
    create: {
      slug: data.slug,
      title: data.title,
      description: data.description ?? null,
      level: data.level as LevelJLPT,
      isPublished: options.isPublished ?? false,
    },
    update: {
      title: data.title,
      description: data.description ?? null,
      level: data.level as LevelJLPT,
      ...(options.isPublished !== undefined ? { isPublished: options.isPublished } : {}),
    },
  });

  let lessonCount = 0;
  let kosakataRows = 0;
  let questionCount = 0;

  for (const mod of data.modules) {
    const modSlug = moduleSlugFromTitle(mod.title, mod.order);
    const moduleRow = await prisma.module.upsert({
      where: { courseId_slug: { courseId: course.id, slug: modSlug } },
      create: {
        courseId: course.id,
        slug: modSlug,
        title: mod.title,
        order: mod.order,
      },
      update: {
        title: mod.title,
        order: mod.order,
      },
    });

    for (const lesson of mod.lessons) {
      const lessonRow = await prisma.lesson.upsert({
        where: { slug: lesson.slug },
        create: {
          moduleId: moduleRow.id,
          slug: lesson.slug,
          title: lesson.title,
          order: lesson.order,
          videoUrl: lesson.videoUrl ?? null,
        },
        update: {
          moduleId: moduleRow.id,
          title: lesson.title,
          order: lesson.order,
          videoUrl: lesson.videoUrl ?? null,
        },
      });
      lessonCount += 1;

      if (lesson.flashcards.length > 0) {
        await prisma.materialKosakata.deleteMany({ where: { lessonId: lessonRow.id } });
        await prisma.materialKosakata.createMany({
          data: lesson.flashcards.map((card) => ({
            lessonId: lessonRow.id,
            kosakata: card.kosakata,
            furigana: card.furigana ?? null,
            romaji: card.romaji ?? null,
            arti: card.arti,
            contohKalimat: card.contohKalimat ?? null,
          })),
        });
        kosakataRows += lesson.flashcards.length;
      }

      if (lesson.questions.length > 0) {
        await prisma.questionOption.deleteMany({
          where: { question: { lessonId: lessonRow.id } },
        });
        await prisma.question.deleteMany({ where: { lessonId: lessonRow.id } });

        for (const q of lesson.questions) {
          await prisma.question.create({
            data: {
              lessonId: lessonRow.id,
              type: 'QUIZ',
              questionText: q.questionText,
              explanation: q.explanation ?? null,
              options: {
                create: q.options.map((opt) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                })),
              },
            },
          });
          questionCount += 1;
        }
      }
    }
  }

  return {
    courseId: course.id,
    moduleCount: data.modules.length,
    lessonCount,
    kosakataRows,
    questionCount,
  };
}
