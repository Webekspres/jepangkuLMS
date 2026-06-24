import type { LmsBadgeRarity } from '@prisma/client';
import type { BadgeRarity } from '@/features/student/components/student-achievements-data';

export const LMS_BADGE_RARITY_OPTIONS: { value: LmsBadgeRarity; label: BadgeRarity }[] = [
  { value: 'COMMON', label: 'Common' },
  { value: 'RARE', label: 'Rare' },
  { value: 'EPIC', label: 'Epic' },
  { value: 'LEGENDARY', label: 'Legendary' },
];

const RARITY_TO_DISPLAY: Record<LmsBadgeRarity, BadgeRarity> = {
  COMMON: 'Common',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
};

const DISPLAY_TO_PRISMA: Record<BadgeRarity, LmsBadgeRarity> = {
  Common: 'COMMON',
  Rare: 'RARE',
  Epic: 'EPIC',
  Legendary: 'LEGENDARY',
};

/** Safe display rarity for UI — never returns undefined. */
export function normalizeBadgeRarityDisplay(
  rarity: LmsBadgeRarity | BadgeRarity | string | null | undefined,
): BadgeRarity {
  if (!rarity) return 'Common';

  const asPrisma = RARITY_TO_DISPLAY[rarity as LmsBadgeRarity];
  if (asPrisma) return asPrisma;

  const normalized = rarity.trim();
  if (normalized in DISPLAY_TO_PRISMA) {
    return normalized as BadgeRarity;
  }

  const upper = normalized.toUpperCase();
  if (upper in RARITY_TO_DISPLAY) {
    return RARITY_TO_DISPLAY[upper as LmsBadgeRarity];
  }

  return 'Common';
}

export function mapLmsBadgeRarityToDisplay(
  rarity: LmsBadgeRarity | null | undefined,
): BadgeRarity {
  return normalizeBadgeRarityDisplay(rarity);
}

export function parseLmsBadgeRarity(input: string): LmsBadgeRarity {
  const normalized = input.trim().toUpperCase();
  if (normalized === 'COMMON' || normalized === 'RARE' || normalized === 'EPIC' || normalized === 'LEGENDARY') {
    return normalized;
  }
  return 'COMMON';
}
