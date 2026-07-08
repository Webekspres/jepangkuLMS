import type { LmsBadgeRarity } from '@prisma/client';

/**
 * SINGLE SOURCE OF TRUTH untuk ekonomi XP & Poin LMS JepangKu.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * KENAPA ANGKA-ANGKANYA KECIL?
 * Core Backend memakai kurva level LINEAR & kasual:
 *   xp_required(L) = (L - 1) * 50   →  TEPAT 50 XP untuk naik 1 level (selalu).
 *   Max level 100  →  total hanya 4.950 XP.
 *
 * Artinya XP HARUS sangat kecil & FLAT. Bonus performa (jawaban benar) TIDAK
 * boleh menambah XP — kalau tidak, satu kuis/tryout bisa melompati banyak level
 * dan merusak progression. Maka:
 *   • XP   = flat, kecil, "rasa progres harian".
 *   • Poin = mata uang LMS (leaderboard / toko item) — jauh lebih besar (≈10×),
 *            boleh skala dengan performa supaya terasa "kaya".
 *
 * XP dikirim ke Core (level global). Poin disimpan lokal (UserLmsStats).
 * ───────────────────────────────────────────────────────────────────────────
 */

// --- Kurva Core (cermin Backend — jangan diubah sepihak) ---
export const CORE_XP_PER_LEVEL = 50;
export const CORE_MAX_LEVEL = 100;
/** Total XP untuk mencapai level maksimum: (100 - 1) * 50 = 4.950. */
export const CORE_MAX_TOTAL_XP = (CORE_MAX_LEVEL - 1) * CORE_XP_PER_LEVEL;

/** Minimum cumulative `total_xp` untuk berada di level L (selaras Core `levels.xp_required`). */
export function coreXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * CORE_XP_PER_LEVEL;
}

export type CoreLevelProgress = {
  percent: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  xpRemaining: number;
  isMaxLevel: boolean;
};

/** Progress XP dalam level saat ini menuju level berikutnya. */
export function getCoreLevelProgress(totalXp: number, level: number): CoreLevelProgress {
  const safeLevel = Math.max(1, Math.min(level, CORE_MAX_LEVEL));
  const isMaxLevel = safeLevel >= CORE_MAX_LEVEL;
  const currentThreshold = coreXpRequiredForLevel(safeLevel);
  const nextThreshold = isMaxLevel
    ? currentThreshold
    : coreXpRequiredForLevel(safeLevel + 1);
  const xpNeededForNextLevel = isMaxLevel ? 0 : nextThreshold - currentThreshold;
  const xpInCurrentLevel = Math.max(0, totalXp - currentThreshold);
  const xpRemaining = isMaxLevel ? 0 : Math.max(0, nextThreshold - totalXp);

  let percent = 0;
  if (isMaxLevel) {
    percent = 100;
  } else if (xpNeededForNextLevel > 0) {
    percent = Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100);
  }

  return {
    percent: Math.round(percent * 10) / 10,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    xpRemaining,
    isMaxLevel,
  };
}

export type GamificationReward = { xp: number; points: number };

/**
 * Matriks reward per aksi. `xp` selalu FLAT (tidak skala dengan jumlah benar).
 * Reward bertanda "(bonus …)" ditambahkan DI ATAS reward dasarnya.
 */
export const GAMIFICATION_REWARDS = {
  /** Login harian — pendorong engagement kasual (~25 hari = 1 level). */
  DAILY_LOGIN: { xp: 2, points: 20 },
  /** Selesai 1 pelajaran — unit progres utama (10 pelajaran = 1 level). */
  LESSON_COMPLETED: { xp: 5, points: 50 },
  /** Eksplor flashcard pelajaran (sekali per pelajaran). */
  FLASHCARD_EXPLORED: { xp: 2, points: 20 },
  /** Komentar/diskusi pelajaran — sosial → POIN saja, tanpa XP (anti-spam). */
  LESSON_COMMENT: { xp: 0, points: 10 },
  /** Menyelesaikan kuis pelajaran (sekali per pelajaran). */
  QUIZ_COMPLETED: { xp: 10, points: 100 },
  /** Bonus skor sempurna kuis — DI ATAS QUIZ_COMPLETED. */
  QUIZ_PERFECT_SCORE: { xp: 5, points: 50 },
  /** Milestone: menuntaskan satu modul. */
  MODULE_COMPLETED: { xp: 15, points: 150 },
  /** Menyelesaikan satu sesi tryout JLPT. */
  TRYOUT_COMPLETED: { xp: 15, points: 150 },
  /** Bonus lulus tryout (≥ ambang) — DI ATAS TRYOUT_COMPLETED. */
  TRYOUT_PASSED: { xp: 10, points: 100 },
  /** Milestone besar: menuntaskan satu kursus penuh. */
  COURSE_COMPLETED: { xp: 25, points: 250 },
} as const satisfies Record<string, GamificationReward>;

export type GamificationActionKey = keyof typeof GAMIFICATION_REWARDS;

/**
 * Bonus POIN per jawaban benar di kuis/tryout. POIN SAJA — TIDAK PERNAH XP,
 * supaya kurva 50 XP/level tetap aman berapa pun jumlah soal.
 */
export const POINTS_PER_CORRECT_ANSWER = 10;

/** Ambang persentase: kuis "sempurna" & tryout "lulus". */
export const QUIZ_PERFECT_SCORE_PERCENT = 100;
export const TRYOUT_PASS_SCORE_PERCENT = 60;

/**
 * Bonus XP saat unlock badge, per rarity. Sengaja kecil (≤ setengah level)
 * agar koleksi badge terasa spesial tanpa meledakkan level.
 */
export const BADGE_XP_BONUS_BY_RARITY: Record<LmsBadgeRarity, number> = {
  COMMON: 5,
  RARE: 10,
  EPIC: 20,
  LEGENDARY: 25,
};

/** XP flat untuk menyelesaikan kuis, termasuk bonus skor sempurna bila tercapai. */
export function resolveQuizXp(scorePercent: number): number {
  const base = GAMIFICATION_REWARDS.QUIZ_COMPLETED.xp;
  return scorePercent >= QUIZ_PERFECT_SCORE_PERCENT
    ? base + GAMIFICATION_REWARDS.QUIZ_PERFECT_SCORE.xp
    : base;
}

/** XP flat untuk menyelesaikan tryout, termasuk bonus lulus bila tercapai. */
export function resolveTryoutXp(scorePercent: number): number {
  const base = GAMIFICATION_REWARDS.TRYOUT_COMPLETED.xp;
  return scorePercent >= TRYOUT_PASS_SCORE_PERCENT
    ? base + GAMIFICATION_REWARDS.TRYOUT_PASSED.xp
    : base;
}
