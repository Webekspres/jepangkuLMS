import { prisma } from '@/lib/prisma';

/**
 * Backfill nullable external IDs for existing courses seeded before import-framework V1.
 * Uses stable slugs as external identifiers (same convention as sensei-jlpt-v1 adapter).
 */
async function main() {
  const write = process.argv.includes('--write');

  const courses = await prisma.course.findMany({
    where: { courseExternalId: null },
    select: { id: true, slug: true, title: true },
  });

  const modules = await prisma.module.findMany({
    where: { moduleExternalId: null },
    select: { id: true, slug: true, title: true, course: { select: { slug: true } } },
  });

  const lessons = await prisma.lesson.findMany({
    where: { lessonExternalId: null },
    select: { id: true, slug: true, title: true, module: { select: { slug: true } } },
  });

  console.log(`Courses missing courseExternalId: ${courses.length}`);
  console.log(`Modules missing moduleExternalId: ${modules.length}`);
  console.log(`Lessons missing lessonExternalId: ${lessons.length}`);

  if (!write) {
    console.log('\nDry run only. Re-run with --write to apply updates.');
    return;
  }

  let courseUpdates = 0;
  for (const course of courses) {
    await prisma.course.update({
      where: { id: course.id },
      data: { courseExternalId: course.slug },
    });
    courseUpdates += 1;
  }

  let moduleUpdates = 0;
  for (const module of modules) {
    await prisma.module.update({
      where: { id: module.id },
      data: { moduleExternalId: module.slug },
    });
    moduleUpdates += 1;
  }

  let lessonUpdates = 0;
  for (const lesson of lessons) {
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { lessonExternalId: lesson.slug },
    });
    lessonUpdates += 1;
  }

  console.log(`Updated ${courseUpdates} courses, ${moduleUpdates} modules, ${lessonUpdates} lessons.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
