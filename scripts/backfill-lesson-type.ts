import { prisma } from '@/lib/prisma';
import type { LessonType } from '@prisma/client';
import { resolveLessonTypeFromLegacyContent } from '@/features/learning/lib/lesson-type';

type CandidateLesson = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  videoUrl: string | null;
  _count: {
    kanjis: number;
    kosakatas: number;
    tataBahasas: number;
    questions: number;
  };
};

function classifyLesson(lesson: CandidateLesson): LessonType | null {
  return resolveLessonTypeFromLegacyContent({
    hasVideo: Boolean(lesson.videoUrl?.trim()),
    hasFlashcard:
      lesson._count.kanjis + lesson._count.kosakatas + lesson._count.tataBahasas > 0,
    hasQuiz: lesson._count.questions > 0,
    hasText: Boolean(lesson.content?.trim()),
  });
}

async function main() {
  const write = process.argv.includes('--write');

  const lessons = await prisma.lesson.findMany({
    where: { lessonType: null },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      videoUrl: true,
      _count: {
        select: {
          kanjis: true,
          kosakatas: true,
          tataBahasas: true,
          questions: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  const classified = lessons
    .map((lesson) => ({
      lesson,
      lessonType: classifyLesson(lesson),
    }))
    .filter((row): row is { lesson: CandidateLesson; lessonType: LessonType } => row.lessonType !== null);

  const ambiguous = lessons.length - classified.length;

  console.log(`Legacy lessons: ${lessons.length}`);
  console.log(`Classifiable lessons: ${classified.length}`);
  console.log(`Ambiguous/mixed lessons: ${ambiguous}`);

  for (const row of classified.slice(0, 20)) {
    console.log(`- ${row.lesson.slug} -> ${row.lessonType}`);
  }

  if (!write) {
    console.log('\nDry run only. Re-run with --write to persist lesson types.');
    return;
  }

  if (classified.length === 0) {
    console.log('No lessons to update.');
    return;
  }

  await prisma.$transaction(
    classified.map((row) =>
      prisma.lesson.update({
        where: { id: row.lesson.id },
        data: { lessonType: row.lessonType },
      }),
    ),
  );

  console.log(`Updated ${classified.length} lessons.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
