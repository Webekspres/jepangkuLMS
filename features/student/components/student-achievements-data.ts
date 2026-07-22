import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { normalizeBadgeRarityDisplay } from '@/lib/lms/badge-rarity';
import type { StudentAchievementBadge } from '@/features/student/lib/core-badge-mapper';

export type BadgeRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type AchievementBadge = StudentAchievementBadge;

export type AchievementMilestone = {
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  label: string;
  icon: string;
  status: 'completed' | 'active' | 'locked';
  date: string;
  desc: string;
  xp: number;
  progress?: number;
};

export const BADGE_RARITY_ORDER: BadgeRarity[] = ['Legendary', 'Epic', 'Rare', 'Common'];

/** Urutan filter UI — dari terendah ke tertinggi. */
export const BADGE_RARITY_FILTER_ORDER: BadgeRarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];

export type BadgeRarityFilter = BadgeRarity | 'all';

export type BadgeRarityCounts = Record<BadgeRarityFilter, number>;

export const BADGE_RARITY_STYLES: Record<
  BadgeRarity,
  { card: string; label: string; chip: string; dot: string; legend: string; ring: string }
> = {
  Common: {
    card: 'bg-muted/40 border-border',
    label: 'text-muted-foreground',
    chip: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
    legend: 'bg-muted/50 border-border text-muted-foreground',
    ring: 'ring-muted-foreground/40',
  },
  Rare: {
    card: 'bg-blue-500/10 border-blue-500/25',
    label: 'text-blue-700 ',
    chip: 'bg-blue-500/15 text-blue-700 ',
    dot: 'bg-blue-500',
    legend: 'bg-blue-500/10 border-blue-500/25 text-blue-700 ',
    ring: 'ring-blue-500/50',
  },
  Epic: {
    card: 'bg-violet-500/10 border-violet-500/25',
    label: 'text-violet-700 ',
    chip: 'bg-violet-500/15 text-violet-700 ',
    dot: 'bg-violet-500',
    legend: 'bg-violet-500/10 border-violet-500/25 text-violet-700 ',
    ring: 'ring-violet-500/50',
  },
  Legendary: {
    card: 'bg-brand-yellow/10 border-brand-yellow/30',
    label: 'text-amber-700 ',
    chip: 'bg-brand-yellow/20 text-amber-700 ',
    dot: 'bg-brand-yellow',
    legend: 'bg-brand-yellow/10 border-brand-yellow/25 text-amber-700 ',
    ring: 'ring-brand-yellow/60',
  },
};

export function resolveAchievementBadgeRarity(
  rarity: BadgeRarity | string | null | undefined,
): BadgeRarity {
  return normalizeBadgeRarityDisplay(rarity);
}

export function getBadgeRarityStyle(rarity: BadgeRarity | string | null | undefined) {
  return BADGE_RARITY_STYLES[resolveAchievementBadgeRarity(rarity)];
}

export function buildAchievementMilestones(totalXp: number): AchievementMilestone[] {
  return [
    {
      level: 'N5',
      label: 'Pemula',
      icon: '🌱',
      status: 'completed',
      date: 'Selesai',
      desc: 'Kuasai hiragana, katakana, dan 80 kanji dasar',
      xp: 1200,
    },
    {
      level: 'N4',
      label: 'Dasar',
      icon: '📚',
      status: 'active',
      date: 'Sedang belajar',
      desc: 'Tata bahasa menengah, 300 kanji',
      xp: totalXp,
      progress: Math.min(99, Math.round((totalXp % 1000) / 10) || 0),
    },
    {
      level: 'N3',
      label: 'Menengah',
      icon: '🗺️',
      status: 'locked',
      date: 'Terkunci',
      desc: 'Percakapan kompleks, 650 kanji',
      xp: 0,
    },
    {
      level: 'N2',
      label: 'Lanjutan',
      icon: '🏔️',
      status: 'locked',
      date: 'Terkunci',
      desc: 'Teks formal & akademik, 1000 kanji',
      xp: 0,
    },
    {
      level: 'N1',
      label: 'Mahir',
      icon: '👑',
      status: 'locked',
      date: 'Terkunci',
      desc: 'Setara native speaker, 2000 kanji',
      xp: 0,
    },
  ];
}

export type BadgeFilter = 'all' | 'unlocked' | 'locked';
export type BadgeSort = 'default' | 'rarity-desc' | 'rarity-asc' | 'xp-desc';

export function getAchievementSummary(badges: AchievementBadge[]) {
  const unlocked = badges.filter((b) => b.unlocked);

  return {
    unlockedCount: unlocked.length,
    totalCount: badges.length,
    badgeXpTotal: unlocked.reduce((sum, b) => sum + b.xp, 0),
    badgeXpTotalLabel: formatDisplayNumber(unlocked.reduce((sum, b) => sum + b.xp, 0)),
  };
}

export function filterAchievementBadges(
  badges: AchievementBadge[],
  filter: BadgeFilter,
  rarity: BadgeRarityFilter,
  sort: BadgeSort,
): AchievementBadge[] {
  let list = badges.filter((b) => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  }).filter((b) => (rarity === 'all' ? true : resolveAchievementBadgeRarity(b.rarity) === rarity));

  if (sort === 'rarity-desc') {
    list = [...list].sort(
      (a, b) =>
        BADGE_RARITY_ORDER.indexOf(resolveAchievementBadgeRarity(a.rarity)) -
        BADGE_RARITY_ORDER.indexOf(resolveAchievementBadgeRarity(b.rarity)),
    );
  } else if (sort === 'rarity-asc') {
    list = [...list].sort(
      (a, b) =>
        BADGE_RARITY_ORDER.indexOf(resolveAchievementBadgeRarity(b.rarity)) -
        BADGE_RARITY_ORDER.indexOf(resolveAchievementBadgeRarity(a.rarity)),
    );
  } else if (sort === 'xp-desc') {
    list = [...list].sort((a, b) => b.xp - a.xp);
  }

  return list;
}

function filterByStatus(badges: AchievementBadge[], filter: BadgeFilter): AchievementBadge[] {
  if (filter === 'unlocked') return badges.filter((b) => b.unlocked);
  if (filter === 'locked') return badges.filter((b) => !b.unlocked);
  return badges;
}

/** Hitung badge per rarity untuk chip filter (mengikuti filter status Semua/Diraih/Terkunci). */
export function getBadgeRarityCounts(
  badges: AchievementBadge[],
  filter: BadgeFilter,
): BadgeRarityCounts {
  const statusFiltered = filterByStatus(badges, filter);
  const counts: BadgeRarityCounts = {
    all: statusFiltered.length,
    Common: 0,
    Rare: 0,
    Epic: 0,
    Legendary: 0,
  };

  for (const badge of statusFiltered) {
    const key = resolveAchievementBadgeRarity(badge.rarity);
    counts[key] += 1;
  }

  return counts;
}

export function buildAchievementBadgeEmptyMessage(
  filter: BadgeFilter,
  rarity: BadgeRarityFilter,
): string {
  const statusLabel =
    filter === 'unlocked' ? 'yang sudah diraih' : filter === 'locked' ? 'yang masih terkunci' : '';
  const rarityLabel = rarity === 'all' ? '' : ` rarity ${rarity}`;

  if (rarity !== 'all' && filter !== 'all') {
    return `Tidak ada badge${rarityLabel} ${statusLabel}.`;
  }
  if (rarity !== 'all') {
    return `Tidak ada badge${rarityLabel} di koleksi ini.`;
  }
  if (filter === 'unlocked') {
    return 'Belum ada badge yang diraih. Selesaikan pelajaran atau kuis untuk membuka badge pertama!';
  }
  if (filter === 'locked') {
    return 'Semua badge sudah diraih — luar biasa!';
  }
  return 'Belum ada badge tersedia.';
}

export function getBadgeXpByRarity(badges: AchievementBadge[], rarity: BadgeRarity) {
  const unlocked = badges.filter(
    (b) => resolveAchievementBadgeRarity(b.rarity) === rarity && b.unlocked,
  );
  return {
    count: unlocked.length,
    xp: unlocked.reduce((sum, b) => sum + b.xp, 0),
  };
}
