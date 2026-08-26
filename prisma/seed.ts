import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type LevelJLPT } from '@prisma/client';

import { importMateriFromXlsx } from './lib/import-materi-from-xlsx';
import { seedLmsBadges } from './lib/seed-badges';
import { seedLiveClasses } from './lib/seed-live-classes';
import { seedN4CourseStructure } from './lib/seed-n4-structure';
import { seedN5AksaraMateri } from './lib/seed-n5-aksara';
import { seedN5CourseStructure } from './lib/seed-n5-structure';
import { seedTryoutSessions } from './lib/seed-tryout';
import { DEFAULT_LMS_ROLE } from '../lib/auth/lms-roles';
import { N5_LESSON_COUNT } from './lib/n5-curriculum';

const DEMO_USER_ID = 'user_seed_demo_lms';

/** Tepat 2 kursus published: 1 gratis + 1 berbayar (untuk demo marketing/katalog). */
const COURSE_CATALOG = [
  {
    slug: 'jlpt-n5-kursus-lengkap',
    title: 'JLPT N5 — Kursus Lengkap',
    level: 'N5' as LevelJLPT,
    description:
      'Dari nol sampai lulus N5! Hiragana, Katakana, 100 Kanji, 200+ kosakata, 64 pola tata bahasa, dan simulasi ujian.',
    outcomes: [
      'Hiragana & Katakana lancar',
      '100 kanji N5 + kosakata inti',
      '64 pola tata bahasa dasar',
      'Siap simulasi ujian N5',
    ],
    isPublished: true,
    priceIdr: 0,
    isFeatured: true,
    category: 'KURSUS_GRATIS' as const,
  },
  {
    slug: 'n4-tata-bahasa-intensif',
    title: 'N4 Tata Bahasa Intensif',
    level: 'N4' as LevelJLPT,
    description:
      'Pola kalimat N4 lengkap: て-form, たい, から, まで, dan 40+ pola lainnya — cocok setelah N5.',
    outcomes: [
      'Kuasai て-form & sambungan',
      '40+ pola tata bahasa N4',
      'Latihan soal bergaya JLPT',
      'Siap naik ke reading N4',
    ],
    isPublished: true,
    priceIdr: 299_000,
    isFeatured: true,
    category: 'KURSUS_UTAMA' as const,
  },
] as const;

const PUBLISHED_COURSE_SLUGS = COURSE_CATALOG.map((c) => c.slug);

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for seeding');
  }

  return new PrismaClient({ adapter: new PrismaPg(connectionString) });
}

async function seedCourses(prisma: PrismaClient) {
  for (const course of COURSE_CATALOG) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      create: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        outcomes: [...course.outcomes],
        level: course.level,
        isPublished: course.isPublished,
        priceIdr: course.priceIdr,
        isFeatured: course.isFeatured,
        category: course.category,
      },
      update: {
        title: course.title,
        description: course.description,
        outcomes: [...course.outcomes],
        level: course.level,
        isPublished: course.isPublished,
        priceIdr: course.priceIdr,
        isFeatured: course.isFeatured,
        category: course.category,
      },
    });
  }

  // Sembunyikan sisa katalog lama agar marketing hanya menampilkan 2 program demo.
  await prisma.course.updateMany({
    where: { slug: { notIn: [...PUBLISHED_COURSE_SLUGS] } },
    data: { isPublished: false, isFeatured: false },
  });
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

async function seedN4Content(prisma: PrismaClient) {
  const n4 = await prisma.course.findUniqueOrThrow({
    where: { slug: 'n4-tata-bahasa-intensif' },
  });
  await seedN4CourseStructure(prisma, n4.id);
  console.log('  ✓ N4 struktur modul & pelajaran');
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

  console.log('🌱 Seeding JepangKu LMS (demo: 2 kursus + 2 live + 2 tryout)...\n');
  console.log('   Sumber materi: docs/Materi LMS JepangKu - Nihongo.xlsx');
  console.log('   Badge gambar: public/badges/*.png\n');

  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    create: { id: DEMO_USER_ID, role: DEFAULT_LMS_ROLE },
    update: {},
  });
  console.log('  ✓ Demo user');

  await seedCourses(prisma);
  console.log(
    `  ✓ ${COURSE_CATALOG.length} kursus published (1 gratis + 1 berbayar); lainnya di-unpublish`,
  );

  const n5CourseId = await seedN5Content(prisma);
  await seedN4Content(prisma);

  await seedLiveClasses(prisma);
  console.log('  ✓ Live class (1 gratis + 1 berbayar)');

  await seedTryoutSessions(prisma);
  console.log('  ✓ JLPT tryout (1 gratis + 1 berbayar) + soal N5 Fase 1');

  const badgeCount = await seedLmsBadges(prisma);
  console.log(`  ✓ ${badgeCount} badge LMS (gambar dari public/badges jika ada)`);

  await seedDemoEnrollment(prisma, n5CourseId);
  console.log('  ✓ Enrollment demo N5');

  const [coursesPublished, livePublished, tryoutActive, lessons, badges] = await prisma.$transaction(
    [
      prisma.course.count({ where: { isPublished: true } }),
      prisma.liveClass.count({ where: { isPublished: true } }),
      prisma.tryoutSession.count({ where: { isActive: true } }),
      prisma.lesson.count({ where: { module: { courseId: n5CourseId } } }),
      prisma.lmsBadge.count(),
    ],
  );

  console.log(
    `\n✅ Seed selesai: ${coursesPublished} kursus published, ${livePublished} live class, ` +
      `${tryoutActive} tryout aktif, ${lessons} pelajaran N5 (target ${N5_LESSON_COUNT}), ${badges} badge`,
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
