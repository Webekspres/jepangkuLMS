import type { PrismaClient } from '@prisma/client';
import { N5_ALL_LESSONS } from './n5-curriculum';
import { N5_MODULE_DEFINITIONS } from './n5-modules';
import type { N5Module } from './n5-curriculum';

export type N5StructureIds = {
  moduleIds: Record<string, string>;
  lessonIdsBySlug: Record<string, string>;
};

/** Upsert 6 modul N5 + semua lesson ke kursus yang ditentukan. */
export async function seedN5CourseStructure(
  prisma: PrismaClient,
  courseId: string,
): Promise<N5StructureIds> {
  await prisma.module.deleteMany({
    where: { courseId, slug: 'legacy' },
  });

  const moduleIds: Record<string, string> = {};

  await prisma.module.updateMany({
    where: { courseId },
    data: { order: { increment: 10000 } },
  });

  for (const mod of N5_MODULE_DEFINITIONS) {
    const row = await prisma.module.upsert({
      where: {
        courseId_slug: { courseId, slug: mod.slug },
      },
      create: {
        courseId,
        slug: mod.slug,
        title: mod.title,
        order: mod.order,
        description: mod.description,
      },
      update: {
        title: mod.title,
        description: mod.description,
        order: mod.order,
      },
    });
    moduleIds[mod.slug] = row.id;
  }

  const lessonIdsBySlug: Record<string, string> = {};

  for (const lesson of N5_ALL_LESSONS) {
    const moduleId = moduleIds[lesson.module as N5Module];
    if (!moduleId) {
      throw new Error(`Modul tidak ditemukan untuk lesson ${lesson.slug} (${lesson.module})`);
    }

    const row = await prisma.lesson.upsert({
      where: { slug: lesson.slug },
      create: {
        slug: lesson.slug,
        title: lesson.title,
        order: lesson.order,
        content: lesson.content,
        videoUrl: lesson.videoUrl ?? null,
        moduleId,
      },
      update: {
        title: lesson.title,
        order: lesson.order,
        content: lesson.content,
        videoUrl: lesson.videoUrl ?? null,
        moduleId,
      },
    });
    lessonIdsBySlug[lesson.slug] = row.id;
  }

  return { moduleIds, lessonIdsBySlug };
}

export async function countN5LessonsInCourse(prisma: PrismaClient, courseId: string) {
  return prisma.lesson.count({
    where: { module: { courseId } },
  });
}
