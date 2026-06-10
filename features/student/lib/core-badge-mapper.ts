import type { CoreBadgeCatalogItem, CoreUserBadgeItem } from '@/lib/core/api';
import type { BadgeRarity } from '@/features/student/components/student-achievements-data';

export type StudentAchievementBadge = {
  id: string;
  code: string;
  name: string;
  desc: string;
  imageUrl: string;
  icon: string;
  xp: number;
  unlocked: boolean;
  date: string | null;
  rarity: BadgeRarity;
  badgeType: string;
};

function mapBadgeTypeToRarity(badgeType: string): BadgeRarity {
  switch (badgeType) {
    case 'GLOBAL':
      return 'Legendary';
    case 'LMS_ACHIEVEMENT':
      return 'Epic';
    case 'NEWS_CONTRIBUTOR':
      return 'Rare';
    default:
      return 'Common';
  }
}

function formatBadgeDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

/** Gabungkan katalog badge Core + status unlock user. */
export function mergeCoreBadges(
  catalog: CoreBadgeCatalogItem[],
  unlocked: CoreUserBadgeItem[],
): StudentAchievementBadge[] {
  const unlockedByCode = new Map(unlocked.map((b) => [b.code, b]));

  return catalog.map((item) => {
    const userBadge = unlockedByCode.get(item.code);
    return {
      id: item.id,
      code: item.code,
      name: item.title,
      desc: item.description,
      imageUrl: item.imageUrl,
      icon: '🏅',
      xp: 0,
      unlocked: Boolean(userBadge),
      date: userBadge ? formatBadgeDate(userBadge.unlockedAt) : null,
      rarity: mapBadgeTypeToRarity(item.badgeType),
      badgeType: item.badgeType,
    };
  });
}

/** Hanya badge yang sudah di-unlock (tanpa katalog penuh). */
export function mapUnlockedCoreBadges(unlocked: CoreUserBadgeItem[]): StudentAchievementBadge[] {
  return unlocked.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.title,
    desc: item.description,
    imageUrl: item.imageUrl,
    icon: '🏅',
    xp: 0,
    unlocked: true,
    date: formatBadgeDate(item.unlockedAt),
    rarity: mapBadgeTypeToRarity(item.badgeType),
    badgeType: item.badgeType,
  }));
}
