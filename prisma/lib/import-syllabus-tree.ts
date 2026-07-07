/**
 * Impor silabus Course → Module → Lesson dari JSON (format AI / Admin CMS).
 * Mendukung kosakata, kanji, tata bahasa, dan kuis per pelajaran.
 */
import type { PrismaClient, LevelJLPT } from '@prisma/client';
import { z } from 'zod';
import { slugBaseFromTitle } from '@/lib/lms/slug';

const kosakataSchema = z.object({
  kosakata: z.string(),
  furigana: z.string().optional(),
  romaji: z.string().optional(),
  arti: z.string(),
  contohKalimat: z.string().optional(),
});

const kanjiSchema = z.object({
  huruf: z.string(),
  furigana: z.string().optional(),
  romaji: z.string().optional(),
  arti: z.string(),
  onyomi: z.string().optional(),
  kunyomi: z.string().optional(),
});

const tataBahasaSchema = z.object({
  tataBahasa: z.string(),
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
  xpReward: z.number().int().positive().default(10),
  options: z.array(questionOptionSchema).min(2),
});

const lessonSchema = z.object({
  title: z.string(),
  slug: z.string(),
  order: z.number().int().positive(),
  content: z.string().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  kosakatas: z.array(kosakataSchema).default([]),
  kanjis: z.array(kanjiSchema).default([]),
  tataBahasas: z.array(tataBahasaSchema).default([]),
  questions: z.array(questionSchema).default([]),
});

const moduleSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
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

export type ImportSyllabusTreeResult = {
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  kosakataCount: number;
  kanjiCount: number;
  tataBahasaCount: number;
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
  let kosakataCount = 0;
  let kanjiCount = 0;
  let tataBahasaCount = 0;
  let questionCount = 0;

  for (const mod of data.modules) {
    const modSlug = mod.slug ?? slugBaseFromTitle(mod.title, 'modul', mod.order);
    const moduleRow = await prisma.module.upsert({
      where: { courseId_slug: { courseId: course.id, slug: modSlug } },
      create: {
        courseId: course.id,
        slug: modSlug,
        title: mod.title,
        description: mod.description ?? null,
        order: mod.order,
      },
      update: {
        title: mod.title,
        description: mod.description ?? null,
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
          content: lesson.content ?? null,
          videoUrl: lesson.videoUrl ?? null,
        },
        update: {
          moduleId: moduleRow.id,
          title: lesson.title,
          order: lesson.order,
          content: lesson.content ?? null,
          videoUrl: lesson.videoUrl ?? null,
        },
      });
      lessonCount += 1;

      if (lesson.kosakatas.length > 0) {
        await prisma.materialKosakata.deleteMany({ where: { lessonId: lessonRow.id } });
        await prisma.materialKosakata.createMany({
          data: lesson.kosakatas.map((card) => ({
            lessonId: lessonRow.id,
            kosakata: card.kosakata,
            furigana: card.furigana ?? null,
            romaji: card.romaji ?? null,
            arti: card.arti,
            contohKalimat: card.contohKalimat ?? null,
          })),
        });
        kosakataCount += lesson.kosakatas.length;
      }

      if (lesson.kanjis.length > 0) {
        await prisma.materialKanji.deleteMany({ where: { lessonId: lessonRow.id } });
        await prisma.materialKanji.createMany({
          data: lesson.kanjis.map((card) => ({
            lessonId: lessonRow.id,
            huruf: card.huruf,
            furigana: card.furigana ?? null,
            romaji: card.romaji ?? null,
            arti: card.arti,
            onyomi: card.onyomi ?? null,
            kunyomi: card.kunyomi ?? null,
          })),
        });
        kanjiCount += lesson.kanjis.length;
      }

      if (lesson.tataBahasas.length > 0) {
        await prisma.materialTataBahasa.deleteMany({ where: { lessonId: lessonRow.id } });
        await prisma.materialTataBahasa.createMany({
          data: lesson.tataBahasas.map((card) => ({
            lessonId: lessonRow.id,
            tataBahasa: card.tataBahasa,
            arti: card.arti,
            contohKalimat: card.contohKalimat ?? null,
          })),
        });
        tataBahasaCount += lesson.tataBahasas.length;
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
              // Lesson quiz XP follows the gamification reward SSOT, not per-question config.
              xpReward: 0,
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
    kosakataCount,
    kanjiCount,
    tataBahasaCount,
    questionCount,
  };
}
