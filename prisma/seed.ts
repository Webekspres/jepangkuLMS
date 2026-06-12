import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type LevelJLPT } from '@prisma/client';
import { Pool } from 'pg';

import { importMateriFromXlsx } from './lib/import-materi-from-xlsx';
import { N5_ALL_LESSONS, N5_LESSON_COUNT } from './lib/n5-curriculum';
import { seedN5AksaraMateri } from './lib/seed-n5-aksara';

const DEMO_USER_ID = 'user_seed_demo_lms';

const CATALOG = [
  {
    slug: 'jlpt-n5-kursus-lengkap',
    title: 'JLPT N5 — Kursus Lengkap',
    level: 'N5' as LevelJLPT,
    description:
      'Dari nol sampai lulus N5! Hiragana, Katakana, 100 Kanji, 200+ kosakata, 64 pola tata bahasa, dan simulasi ujian.',
    isPublished: true,
  },
  {
    slug: 'n4-tata-bahasa-intensif',
    title: 'N4 Tata Bahasa Intensif',
    level: 'N4' as LevelJLPT,
    description: 'Pola kalimat N4 lengkap: て-form, たい, から, まで, dan 40+ pola lainnya.',
    isPublished: false,
  },
  {
    slug: 'kanji-n5-n4-master',
    title: 'Kanji N5 & N4 Master',
    level: 'N4' as LevelJLPT,
    description: 'Hafalkan 380 kanji N5+N4 dengan metode visual mnemonik yang efektif.',
    isPublished: false,
  },
  {
    slug: 'kosakata-n4-1500-kata',
    title: 'Kosakata N4 — 1500 Kata',
    level: 'N4' as LevelJLPT,
    description: 'Pelajari 1500 kosakata N4 dengan flashcard interaktif dan konteks kalimat nyata.',
    isPublished: false,
  },
  {
    slug: 'jlpt-n3-kursus-menengah',
    title: 'JLPT N3 — Kursus Menengah',
    level: 'N3' as LevelJLPT,
    description: 'Kuasai N3 dengan 650 kanji, tata bahasa kompleks, dan reading comprehension.',
    isPublished: false,
  },
  {
    slug: 'japanese-speaking-listening-n4',
    title: 'Japanese Speaking & Listening N4',
    level: 'N4' as LevelJLPT,
    description: 'Latih percakapan natural dan listening skill dengan dialog audio native speaker.',
    isPublished: false,
  },
] as const;

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for seeding');
  }

  const pool = new Pool({ connectionString });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

async function main() {
  const prisma = createPrisma();

  console.log('Seeding LMS database...');

  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    create: { id: DEMO_USER_ID },
    update: {},
  });

  for (const course of CATALOG) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      create: course,
      update: {
        title: course.title,
        description: course.description,
        level: course.level,
        isPublished: course.isPublished,
      },
    });
  }

  const n5 = await prisma.course.findUniqueOrThrow({
    where: { slug: 'jlpt-n5-kursus-lengkap' },
  });

  const lessonIdsBySlug: Record<string, string> = {};

  for (const lesson of N5_ALL_LESSONS) {
    const row = await prisma.lesson.upsert({
      where: { slug: lesson.slug },
      create: {
        slug: lesson.slug,
        title: lesson.title,
        order: lesson.order,
        content: lesson.content,
        videoUrl: lesson.videoUrl ?? null,
        courseId: n5.id,
      },
      update: {
        title: lesson.title,
        order: lesson.order,
        content: lesson.content,
        videoUrl: lesson.videoUrl ?? null,
        courseId: n5.id,
      },
    });
    lessonIdsBySlug[lesson.slug] = row.id;
  }

  const aksaraCount = await seedN5AksaraMateri(prisma, lessonIdsBySlug);
  console.log(`  Seeded ${aksaraCount} aksara flashcard rows`);

  await importMateriFromXlsx(prisma, { courseSlug: n5.slug });

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: { userId: DEMO_USER_ID, courseId: n5.id },
    },
    create: {
      userId: DEMO_USER_ID,
      courseId: n5.id,
      status: 'ACTIVE',
    },
    update: { status: 'ACTIVE' },
  });

  const counts = await prisma.$transaction([
    prisma.course.count(),
    prisma.lesson.count({ where: { courseId: n5.id } }),
    prisma.materialKanji.count(),
    prisma.materialKosakata.count(),
    prisma.materialTataBahasa.count(),
    prisma.question.count(),
    prisma.category.count(),
  ]);

  console.log(
    `Seed complete: ${counts[0]} courses, ${counts[1]} N5 lessons (expected ${N5_LESSON_COUNT}), ` +
      `${counts[2]} kanji, ${counts[3]} kosakata, ${counts[4]} tata bahasa, ` +
      `${counts[5]} questions, ${counts[6]} categories`,
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
