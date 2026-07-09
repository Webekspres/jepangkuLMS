import type { RewardTier, RewardType, ShowRewardInput } from './types';

export const REWARD_TIER_BY_TYPE: Record<RewardType, RewardTier> = {
  'lesson-complete': 'small',
  'quiz-pass': 'small',
  'quiz-complete': 'small',
  'flashcard-complete': 'small',
  'reading-complete': 'small',
  'system-alert': 'small',
  'daily-login': 'medium',
  'module-complete': 'large',
  'course-complete': 'large',
  'badge-unlocked': 'large',
  'achievement-unlocked': 'large',
  'certificate-earned': 'large',
  'login-streak-milestone': 'large',
  'level-up': 'large',
};

export type RewardPresentation = {
  title: string;
  description?: string;
  accent: 'emerald' | 'red' | 'yellow' | 'navy' | 'orange';
  icon: 'check' | 'calendar' | 'award' | 'trophy' | 'trending' | 'alert';
};

export function getRewardTier(type: RewardType): RewardTier {
  return REWARD_TIER_BY_TYPE[type];
}

export function resolveRewardPresentation(input: ShowRewardInput): RewardPresentation {
  switch (input.type) {
    case 'daily-login':
      return {
        title: 'Absen Harian Berhasil!',
        description: buildDailyLoginDescription(input),
        accent: 'red',
        icon: 'calendar',
      };
    case 'lesson-complete':
      return {
        title: input.title ?? 'Pelajaran Selesai!',
        description: input.description ?? input.message,
        accent: 'emerald',
        icon: 'check',
      };
    case 'quiz-pass':
    case 'quiz-complete':
      return {
        title: input.title ?? 'Quiz Selesai!',
        description: input.description ?? input.message,
        accent: 'emerald',
        icon: 'check',
      };
    case 'flashcard-complete':
      return {
        title: input.title ?? 'Flashcard Selesai!',
        description: input.description ?? input.message,
        accent: 'emerald',
        icon: 'check',
      };
    case 'reading-complete':
      return {
        title: input.title ?? 'Materi Dibaca!',
        description: input.description ?? input.message,
        accent: 'emerald',
        icon: 'check',
      };
    case 'module-complete':
      return {
        title: input.title ?? 'Modul Selesai!',
        description: input.description ?? input.message,
        accent: 'yellow',
        icon: 'trophy',
      };
    case 'course-complete':
      return {
        title: input.title ?? 'Kursus Selesai!',
        description: input.description ?? input.message,
        accent: 'yellow',
        icon: 'trophy',
      };
    case 'badge-unlocked':
      return {
        title: input.title ?? 'Pencapaian Baru Terbuka!',
        description:
          input.description ??
          (input.badgeTitle ? `Kamu mendapatkan badge ${input.badgeTitle}.` : undefined),
        accent: 'yellow',
        icon: 'award',
      };
    case 'achievement-unlocked':
      return {
        title: input.title ?? 'Achievement Terbuka!',
        description: input.description ?? input.message,
        accent: 'yellow',
        icon: 'award',
      };
    case 'certificate-earned':
      return {
        title: input.title ?? 'Sertifikat Diperoleh!',
        description: input.description ?? input.message,
        accent: 'yellow',
        icon: 'trophy',
      };
    case 'login-streak-milestone':
      return {
        title: input.title ?? 'Streak Luar Biasa!',
        description:
          input.description ??
          (input.streak != null ? `Kamu mempertahankan streak ${input.streak} hari berturut-turut.` : undefined),
        accent: 'yellow',
        icon: 'trophy',
      };
    case 'level-up':
      return {
        title: input.title ?? 'Naik Level!',
        description:
          input.description ??
          (input.level != null
            ? `Kamu mencapai Level ${input.level}${input.levelTitle ? ` — ${input.levelTitle}` : ''}.`
            : undefined),
        accent: 'navy',
        icon: 'trending',
      };
    case 'system-alert':
      return {
        title: input.title ?? 'Perhatian',
        description: input.description ?? input.message,
        accent: 'orange',
        icon: 'alert',
      };
    default:
      return {
        title: input.title ?? 'Progress Tercatat',
        description: input.description ?? input.message,
        accent: 'emerald',
        icon: 'check',
      };
  }
}

function buildDailyLoginDescription(input: ShowRewardInput): string | undefined {
  const parts: string[] = [];
  if (input.points != null && input.points > 0) {
    parts.push(`+${input.points} Poin`);
  }
  if (input.xp != null && input.xp > 0) {
    parts.push(`+${input.xp} EXP`);
  }

  const rewardLine = parts.length > 0 ? `Kamu mendapatkan ${parts.join(' & ')}.` : undefined;
  const streakLine =
    input.streak != null && input.streak > 0
      ? `Streak hari ke-${input.streak}!`
      : 'Pertahankan streak-mu!';

  return [rewardLine, streakLine].filter(Boolean).join(' ');
}
