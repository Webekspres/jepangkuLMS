import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type LevelJLPT } from '@prisma/client';
import { Pool } from 'pg';

import { importMateriFromXlsx } from './lib/import-materi-from-xlsx';
import { seedLmsBadges } from './lib/seed-badges';
import { seedLiveClasses } from './lib/seed-live-classes';
import { seedN5AksaraMateri } from './lib/seed-n5-aksara';
import { seedN5CourseStructure } from './lib/seed-n5-structure';
import { seedTryoutSessions } from './lib/seed-tryout';
import { DEFAULT_LMS_ROLE } from '../lib/auth/lms-roles';
import { N5_LESSON_COUNT } from './lib/n5-curriculum';

const DEMO_USER_ID = 'user_seed_demo_lms';

const COURSE_CATALOG = [
  {
    slug: 'jlpt-n5-kursus-lengkap',
    title: 'JLPT N5 — Kursus Lengkap',
    level: 'N5' as LevelJLPT,
    description:
      'Dari nol sampai lulus N5! Hiragana, Katakana, 100 Kanji, 200+ kosakata, 64 pola tata bahasa, dan simulasi ujian.',
    isPublished: true,
    priceIdr: 0,
    isFeatured: true,
    category: 'KURSUS_GRATIS' as const,
  },
  {
    slug: 'n4-tata-bahasa-intensif',
    title: 'N4 Tata Bahasa Intensif',
    level: 'N4' as LevelJLPT,
    description: 'Pola kalimat N4 lengkap: て-form, たい, から, まで, dan 40+ pola lainnya.',
    isPublished: false,
    priceIdr: 299_000,
    isFeatured: false,
    category: 'KURSUS_UTAMA' as const,
  },
  {
    slug: 'kanji-n5-n4-master',
    title: 'Kanji N5 & N4 Master',
    level: 'N4' as LevelJLPT,
    description: 'Hafalkan 380 kanji N5+N4 dengan metode visual mnemonik yang efektif.',
    isPublished: false,
    priceIdr: 0,
    isFeatured: false,
    category: 'KURSUS_GRATIS' as const,
  },
  {
    slug: 'kosakata-n4-1500-kata',
    title: 'Kosakata N4 — 1500 Kata',
    level: 'N4' as LevelJLPT,
    description: 'Pelajari 1500 kosakata N4 dengan flashcard interaktif dan konteks kalimat nyata.',
    isPublished: false,
    priceIdr: 0,
    isFeatured: false,
    category: 'KURSUS_GRATIS' as const,
  },
  {
    slug: 'jlpt-n3-kursus-menengah',
    title: 'JLPT N3 — Kursus Menengah',
    level: 'N3' as LevelJLPT,
    description: 'Kuasai N3 dengan 650 kanji, tata bahasa kompleks, dan reading comprehension.',
    isPublished: false,
    priceIdr: 0,
    isFeatured: false,
    category: 'KURSUS_UTAMA' as const,
  },
  {
    slug: 'japanese-speaking-listening-n4',
    title: 'Japanese Speaking & Listening N4',
    level: 'N4' as LevelJLPT,
    description: 'Latih percakapan natural dan listening skill dengan dialog audio native speaker.',
    isPublished: false,
    priceIdr: 0,
    isFeatured: false,
    category: 'KURSUS_TAMBAHAN' as const,
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

async function seedCourses(prisma: PrismaClient) {
  for (const course of COURSE_CATALOG) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      create: course,
      update: {
        title: course.title,
        description: course.description,
        level: course.level,
        isPublished: course.isPublished,
        priceIdr: course.priceIdr,
        isFeatured: course.isFeatured,
        category: course.category,
      },
    });
  }
}

async function seedN5Content(prisma: PrismaClient) {
  const n5 = await prisma.course.findUniqueOrThrow({
    where: { slug: 'jlpt-n5-kursus-lengkap' },
  });

  const { lessonIdsBySlug } = await seedN5CourseStructure(prisma, n5.id);
  const aksaraCount = await seedN5AksaraMateri(prisma, lessonIdsBySlug);
  console.log(`  ✓ N5 struktur + ${aksaraCount} baris flashcard aksara`);

  await importMateriFromXlsx(prisma, { courseSlug: n5.slug });
  console.log('  ✓ Materi XLSX (kanji, kosakata, tata bahasa)');

  return n5.id;
}

async function seedDemoEnrollment(prisma: PrismaClient, courseId: string) {
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: { userId: DEMO_USER_ID, courseId },
    },
    create: {
      userId: DEMO_USER_ID,
      courseId,
      type: 'COURSE',
      status: 'ACTIVE',
    },
    update: { status: 'ACTIVE' },
  });
}

async function main() {
  const prisma = createPrisma();

  console.log('🌱 Seeding JepangKu LMS (production-ready starter)...\n');
  console.log('   Sumber materi: docs/Materi LMS JepangKu - Nihongo.xlsx');
  console.log('   Badge gambar: public/badges/*.png\n');

  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    create: { id: DEMO_USER_ID, role: DEFAULT_LMS_ROLE },
    update: {},
  });
  console.log('  ✓ Demo user');

  await seedCourses(prisma);
  console.log(`  ✓ ${COURSE_CATALOG.length} kursus katalog`);

  const n5CourseId = await seedN5Content(prisma);

  await seedLiveClasses(prisma);
  console.log('  ✓ Live class jadwal');

  await seedTryoutSessions(prisma);
  console.log('  ✓ JLPT tryout sesi + soal N5 Fase 1');

  const badgeCount = await seedLmsBadges(prisma);
  console.log(`  ✓ ${badgeCount} badge LMS (gambar dari public/badges jika ada)`);

  await seedDemoEnrollment(prisma, n5CourseId);
  console.log('  ✓ Enrollment demo N5');

  const [courses, lessons, kanji, kosakata, tataBahasa, questions, categories, badges] =
    await prisma.$transaction([
      prisma.course.count(),
      prisma.lesson.count({ where: { module: { courseId: n5CourseId } } }),
      prisma.materialKanji.count(),
      prisma.materialKosakata.count(),
      prisma.materialTataBahasa.count(),
      prisma.question.count(),
      prisma.category.count(),
      prisma.lmsBadge.count(),
    ]);

  console.log(
    `\n✅ Seed selesai: ${courses} kursus, ${lessons} pelajaran N5 (target ${N5_LESSON_COUNT}), ` +
      `${kanji} kanji, ${kosakata} kosakata, ${tataBahasa} tata bahasa, ` +
      `${questions} soal, ${categories} kategori, ${badges} badge`,
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
