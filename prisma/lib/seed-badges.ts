import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { LmsBadgeUnlockRule, PrismaClient } from '@prisma/client';

/**
 * Starter badges — gambar dari `public/badges/*.png`.
 * Mapping nama file ↔ aturan unlock mengacu pada docs/checklist-lms.md (Fase 1 MVP).
 *
 * Catatan: Hanya satu badge per rule FIRST_LESSON / FIRST_QUIZ (evaluasi unlock saat ini).
 * Badge lain memakai TRYOUT_PASS (skor minimum) atau MANUAL (admin / aturan lanjutan).
 */
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

const BADGE_CATALOG: BadgeSeed[] = [
  {
    code: 'word-rookie',
    title: 'Word Rookie',
    file: 'Word Rookie.png',
    description: 'Badge kosakata N5 — langkah pertama memperluas 語彙.',
    sortOrder: 1,
    unlockRule: 'FIRST_LESSON',
    xpBonus: 25,
    requirementText: 'Selesaikan pelajaran pertamamu',
  },
  {
    code: 'grammar-starter',
    title: 'Grammar Starter',
    file: 'Grammar Starter.png',
    description: 'Badge tata bahasa N5 — memulai pemahaman 文法.',
    sortOrder: 2,
    unlockRule: 'FIRST_QUIZ',
    xpBonus: 30,
    requirementText: 'Selesaikan kuis pertama',
  },
  {
    code: 'kanji-beginner',
    title: 'Kanji Beginner',
    file: 'Kanji Beginner.png',
    description: 'Badge kanji N5 — mengenal 漢字 dasar.',
    sortOrder: 3,
    unlockRule: 'MANUAL',
    xpBonus: 20,
    requirementText: 'Selesaikan modul kanji N5 (grant admin / milestone)',
  },
  {
    code: 'nihongo-explorer',
    title: 'Nihongo Explorer',
    file: 'Nihongo Explorer.png',
    description: 'Badge level N5 — menyelesaikan materi dasar hiragana, katakana, dan kosakata.',
    sortOrder: 4,
    unlockRule: 'MANUAL',
    xpBonus: 35,
    requirementText: 'Selesaikan kurikulum N5 (milestone)',
  },
  {
    code: 'n5-retry-rookie',
    title: 'N5 Retry Rookie',
    file: 'N5 Retry Rookie.png',
    description: 'Quiz N5 — skor di bawah 50%; terus latihan dan coba lagi.',
    sortOrder: 5,
    unlockRule: 'MANUAL',
    xpBonus: 15,
    requirementText: 'Kuis N5 dengan skor < 50% (grant manual / fase 2)',
  },
  {
    code: 'n5-progress-achiever',
    title: 'N5 Progress Achiever',
    file: 'N5 Progress Achiever.png',
    description: 'Quiz N5 — skor 50–74%; progress yang solid.',
    sortOrder: 6,
    unlockRule: 'MANUAL',
    xpBonus: 40,
    requirementText: 'Kuis N5 skor 50–74% (grant manual / fase 2)',
  },
  {
    code: 'n5-high-performer',
    title: 'N5 High Performer',
    file: 'N5 High Performer.png',
    description: 'Quiz / tryout N5 — skor 75–99%; performa tinggi.',
    sortOrder: 7,
    unlockRule: 'TRYOUT_PASS',
    unlockValue: 75,
    xpBonus: 50,
    requirementText: 'Lulus simulasi JLPT N5 dengan skor ≥ 75%',
  },
  {
    code: 'n5-perfect-master',
    title: 'N5 Perfect Master',
    file: 'N5 Perfect Master.png',
    description: 'Quiz / tryout N5 — skor sempurna 100%.',
    sortOrder: 8,
    unlockRule: 'TRYOUT_PASS',
    unlockValue: 100,
    xpBonus: 75,
    requirementText: 'Skor sempurna 100% pada simulasi JLPT N5',
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
  let missing = 0;

  for (const badge of BADGE_CATALOG) {
    const hasFile = onDisk.has(badge.file);
    const imageUrl = hasFile ? badgePublicUrl(badge.file) : null;
    if (!hasFile) missing += 1;

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

  if (missing > 0) {
    console.warn(
      `  ⚠ ${missing} file badge tidak ditemukan di public/badges/ — salin PNG dari desain atau jalankan seed di mesin yang punya asset.`,
    );
  }

  return count;
}

export { BADGE_CATALOG };
