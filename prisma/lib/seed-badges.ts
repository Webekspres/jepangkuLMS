import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { LmsBadgeUnlockRule, PrismaClient } from '@prisma/client';

type BadgeSeed = {
  code: string;
  title: string;
  file: string;
  description: string;
  sortOrder: number;
  unlockRule: LmsBadgeUnlockRule;
  unlockValue?: number;
  xpBonus: number;
  requirementText: string;
};

/** Maps `public/badges/*.png` — imageUrl = `/badges/<filename>` */
const BADGE_CATALOG: BadgeSeed[] = [
  {
    code: 'word-rookie',
    title: 'Word Rookie',
    file: 'Word Rookie.png',
    description: 'Menyelesaikan pelajaran pertamamu di JepangKu.',
    sortOrder: 1,
    unlockRule: 'FIRST_LESSON',
    xpBonus: 25,
    requirementText: 'Selesaikan pelajaran pertama',
  },
  {
    code: 'grammar-starter',
    title: 'Grammar Starter',
    file: 'Grammar Starter.png',
    description: 'Menyelesaikan kuis pertama.',
    sortOrder: 2,
    unlockRule: 'FIRST_QUIZ',
    xpBonus: 30,
    requirementText: 'Selesaikan kuis pertama',
  },
  {
    code: 'kanji-beginner',
    title: 'Kanji Beginner',
    file: 'Kanji Beginner.png',
    description: 'Mulai perjalanan kanji N5.',
    sortOrder: 3,
    unlockRule: 'MANUAL',
    xpBonus: 20,
    requirementText: 'Dibuka oleh admin atau event',
  },
  {
    code: 'nihongo-explorer',
    title: 'Nihongo Explorer',
    file: 'Nihongo Explorer.png',
    description: 'Eksplorasi materi N5 secara konsisten.',
    sortOrder: 4,
    unlockRule: 'MANUAL',
    xpBonus: 35,
    requirementText: 'Capaian khusus JepangKu',
  },
  {
    code: 'n5-progress-achiever',
    title: 'N5 Progress Achiever',
    file: 'N5 Progress Achiever.png',
    description: 'Progress belajar N5 mencapai target mingguan.',
    sortOrder: 5,
    unlockRule: 'MANUAL',
    xpBonus: 40,
    requirementText: 'Progress N5 ≥ 50%',
  },
  {
    code: 'n5-high-performer',
    title: 'N5 High Performer',
    file: 'N5 High Performer.png',
    description: 'Skor tryout JLPT N5 di atas rata-rata simulasi.',
    sortOrder: 6,
    unlockRule: 'TRYOUT_PASS',
    unlockValue: 70,
    xpBonus: 50,
    requirementText: 'Lulus tryout JLPT dengan skor ≥ 70%',
  },
  {
    code: 'n5-perfect-master',
    title: 'N5 Perfect Master',
    file: 'N5 Perfect Master.png',
    description: 'Skor sempurna atau hampir sempurna di simulasi JLPT N5.',
    sortOrder: 7,
    unlockRule: 'TRYOUT_PASS',
    unlockValue: 90,
    xpBonus: 75,
    requirementText: 'Lulus tryout JLPT dengan skor ≥ 90%',
  },
  {
    code: 'n5-retry-rookie',
    title: 'N5 Retry Rookie',
    file: 'N5 Retry Rookie.png',
    description: 'Tidak menyerah — mengulang tryout untuk memperbaiki skor.',
    sortOrder: 8,
    unlockRule: 'MANUAL',
    xpBonus: 15,
    requirementText: 'Ikuti tryout minimal 2 kali',
  },
];

function badgePublicUrl(filename: string): string {
  return `/badges/${encodeURIComponent(filename)}`;
}

function listBadgeFilesOnDisk(): string[] {
  const dir = path.join(process.cwd(), 'public', 'badges');
  try {
    return readdirSync(dir).filter((name) => /\.(png|jpe?g|webp|gif)$/i.test(name));
  } catch {
    return [];
  }
}

export async function seedLmsBadges(prisma: PrismaClient): Promise<number> {
  const onDisk = new Set(listBadgeFilesOnDisk());
  let count = 0;

  for (const badge of BADGE_CATALOG) {
    const imageUrl = onDisk.has(badge.file) ? badgePublicUrl(badge.file) : null;

    await prisma.lmsBadge.upsert({
      where: { code: badge.code },
      create: {
        code: badge.code,
        title: badge.title,
        description: badge.description,
        imageUrl,
        sortOrder: badge.sortOrder,
        unlockRule: badge.unlockRule,
        unlockValue: badge.unlockValue ?? null,
        xpBonus: badge.xpBonus,
        requirementText: badge.requirementText,
      },
      update: {
        title: badge.title,
        description: badge.description,
        imageUrl,
        sortOrder: badge.sortOrder,
        unlockRule: badge.unlockRule,
        unlockValue: badge.unlockValue ?? null,
        xpBonus: badge.xpBonus,
        requirementText: badge.requirementText,
      },
    });
    count += 1;
  }

  return count;
}
