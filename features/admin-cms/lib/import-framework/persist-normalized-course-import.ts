import type { LevelJLPT, PrismaClient, Prisma } from '@prisma/client';
import type { CourseImportResult } from '@/features/admin-cms/lib/course-import-types';
import type {
  NormalizedFlashcardLessonContent,
  NormalizedCourseImport,
  NormalizedLesson,
  NormalizedModule,
  NormalizedQuizLessonContent,
  NormalizedTextLessonContent,
  NormalizedVideoLessonContent,
} from '@/features/admin-cms/lib/import-framework/normalized-import-types';
import { persistFlashcardLesson } from '@/features/admin-cms/lib/import-framework/persist-flashcard-lesson';
import { persistQuizLesson } from '@/features/admin-cms/lib/import-framework/persist-quiz-lesson';
import { persistTextLesson } from '@/features/admin-cms/lib/import-framework/persist-text-lesson';
import { persistVideoLesson } from '@/features/admin-cms/lib/import-framework/persist-video-lesson';
import { mapPrismaImportError } from '@/features/admin-cms/lib/import-framework/map-prisma-import-error';

type Tx = Prisma.TransactionClient;

/** Free (courseId, order) slots before REPLACE upserts — avoids P2002 when legacy rows lack moduleExternalId. */
const MODULE_ORDER_OFFSET = 10_000;

async function releaseModuleOrderSlots(tx: Tx, courseId: string) {
  const modules = await tx.module.findMany({
    where: { courseId },
    select: { id: true, order: true },
  });

  for (const module of modules) {
    await tx.module.update({
      where: { id: module.id },
      data: { order: module.order + MODULE_ORDER_OFFSET },
    });
  }
}

function isTextLesson(
  lesson: NormalizedLesson,
): lesson is NormalizedLesson & { content: NormalizedTextLessonContent } {
  return lesson.content.kind === 'TEXT';
}

function isVideoLesson(
  lesson: NormalizedLesson,
): lesson is NormalizedLesson & { content: NormalizedVideoLessonContent } {
  return lesson.content.kind === 'VIDEO';
}

function isFlashcardLesson(
  lesson: NormalizedLesson,
): lesson is NormalizedLesson & { content: NormalizedFlashcardLessonContent } {
  return lesson.content.kind === 'FLASHCARD';
}

function isQuizLesson(
  lesson: NormalizedLesson,
): lesson is NormalizedLesson & { content: NormalizedQuizLessonContent } {
  return lesson.content.kind === 'QUIZ';
}

async function resetLessonContent(tx: Tx, lessonId: string) {
  await tx.questionOption.deleteMany({ where: { question: { lessonId } } });
  await tx.question.deleteMany({ where: { lessonId } });
  await tx.materialKanji.deleteMany({ where: { lessonId } });
  await tx.materialKosakata.deleteMany({ where: { lessonId } });
  await tx.materialTataBahasa.deleteMany({ where: { lessonId } });
}

async function upsertCourse(tx: Tx, input: NormalizedCourseImport['course']) {
  const existing = await tx.course.findFirst({
    where: {
      OR: [
        { courseExternalId: input.courseExternalId },
        ...(input.slug ? [{ slug: input.slug }] : []),
      ],
    },
  });

  if (existing) {
    return tx.course.update({
      where: { id: existing.id },
      data: {
        courseExternalId: input.courseExternalId,
        title: input.title,
        slug: input.slug ?? existing.slug,
        description: input.description ?? null,
        level: (input.level as LevelJLPT | undefined) ?? undefined,
        isPublished: input.isPublished ?? false,
      },
    });
  }

  return tx.course.create({
    data: {
      courseExternalId: input.courseExternalId,
      title: input.title,
      slug: input.slug ?? input.courseExternalId,
      description: input.description ?? null,
      level: (input.level as LevelJLPT | undefined) ?? 'N5',
      category: 'KURSUS_UTAMA',
      outcomes: [],
      priceIdr: 0,
      isPublished: input.isPublished ?? false,
    },
  });
}

async function upsertModule(tx: Tx, courseId: string, module: NormalizedModule) {
  const existing = await tx.module.findFirst({
    where: {
      courseId,
      OR: [
        { moduleExternalId: module.moduleExternalId },
        ...(module.slug ? [{ slug: module.slug }] : []),
        { order: module.order },
      ],
    },
  });

  if (existing) {
    return tx.module.update({
      where: { id: existing.id },
      data: {
        moduleExternalId: module.moduleExternalId,
        title: module.title,
        slug: module.slug ?? existing.slug,
        description: module.description ?? null,
        order: module.order,
      },
    });
  }

  return tx.module.create({
    data: {
      courseId,
      moduleExternalId: module.moduleExternalId,
      title: module.title,
      slug: module.slug ?? module.moduleExternalId,
      description: module.description ?? null,
      order: module.order,
    },
  });
}

async function upsertLesson(tx: Tx, moduleId: string, lesson: NormalizedLesson) {
  const existingBySlug = lesson.slug
    ? await tx.lesson.findFirst({ where: { slug: lesson.slug } })
    : null;
  const existing =
    existingBySlug ??
    (await tx.lesson.findFirst({
      where: { lessonExternalId: lesson.lessonExternalId },
    }));

  if (existing) {
    return tx.lesson.update({
      where: { id: existing.id },
      data: {
        moduleId,
        lessonExternalId: lesson.lessonExternalId,
        title: lesson.title,
        slug: lesson.slug ?? existing.slug,
        order: lesson.order,
        lessonType: lesson.lessonType,
      },
    });
  }

  return tx.lesson.create({
    data: {
      moduleId,
      lessonExternalId: lesson.lessonExternalId,
      title: lesson.title,
      slug: lesson.slug ?? lesson.lessonExternalId,
      order: lesson.order,
      lessonType: lesson.lessonType,
    },
  });
}

async function persistLessonContent(tx: Tx, lessonId: string, lesson: NormalizedLesson) {
  await resetLessonContent(tx, lessonId);

  if (isTextLesson(lesson)) return persistTextLesson(tx, lessonId, lesson);
  if (isVideoLesson(lesson)) return persistVideoLesson(tx, lessonId, lesson);
  if (isFlashcardLesson(lesson)) return persistFlashcardLesson(tx, lessonId, lesson);
  if (!isQuizLesson(lesson)) {
    throw new Error(`Unsupported lesson content kind for "${lesson.title}".`);
  }
  return persistQuizLesson(tx, lessonId, lesson);
}

export async function persistNormalizedCourseImport(
  prisma: PrismaClient,
  normalized: NormalizedCourseImport,
  preview: CourseImportResult['preview'],
): Promise<CourseImportResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const course = await upsertCourse(tx, normalized.course);
      await releaseModuleOrderSlots(tx, course.id);
      const seenModuleIds: string[] = [];
      const seenLessonIds: string[] = [];

    for (const module of normalized.modules) {
      const persistedModule = await upsertModule(tx, course.id, module);
      seenModuleIds.push(persistedModule.id);

      for (const lesson of module.lessons) {
        const persistedLesson = await upsertLesson(tx, persistedModule.id, lesson);
        seenLessonIds.push(persistedLesson.id);
        await persistLessonContent(tx, persistedLesson.id, lesson);
      }
    }

    if (seenLessonIds.length === 0) {
      throw new Error('Import produced no lessons; aborting REPLACE cleanup.');
    }

    await tx.lesson.deleteMany({
      where: {
        module: { courseId: course.id },
        id: { notIn: seenLessonIds },
      },
    });

    if (seenModuleIds.length === 0) {
      throw new Error('Import produced no modules; aborting REPLACE cleanup.');
    }

    await tx.module.deleteMany({
      where: {
        courseId: course.id,
        id: { notIn: seenModuleIds },
      },
    });

    const lessonCount = normalized.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const allLessons = normalized.modules.flatMap((module) => module.lessons);
    const flashcardLessons = allLessons.filter(isFlashcardLesson);
    const quizLessons = allLessons.filter(isQuizLesson);
    const kosakataCount = flashcardLessons.reduce((sum, lesson) => sum + lesson.content.kosakatas.length, 0);
    const kanjiCount = flashcardLessons.reduce((sum, lesson) => sum + lesson.content.kanjis.length, 0);
    const tataBahasaCount = flashcardLessons.reduce((sum, lesson) => sum + lesson.content.tataBahasas.length, 0);
    const questionCount = quizLessons.reduce((sum, lesson) => sum + lesson.content.questions.length, 0);

    return {
      ok: true,
      preview,
      imported: [
        {
          courseId: course.id,
          moduleCount: normalized.modules.length,
          lessonCount,
          kosakataCount,
          kanjiCount,
          tataBahasaCount,
          questionCount,
        },
      ],
    };
    });
  } catch (error) {
    const mapped = mapPrismaImportError(error);
    if (!mapped) throw error;

    return {
      ok: false,
      preview: {
        ...preview,
        ok: false,
        errors: [...preview.errors, ...mapped.errors],
      },
      imported: [],
      errors: mapped.errors,
      message: mapped.message,
    };
  }
}
