import { describe, expect, test } from 'bun:test';
import {
  BADGE_RARITY_FILTER_ORDER,
  buildAchievementBadgeEmptyMessage,
  filterAchievementBadges,
  getBadgeRarityCounts,
  type AchievementBadge,
} from '@/features/student/components/student-achievements-data';

const SAMPLE_BADGES: AchievementBadge[] = [
  {
    id: '1',
    code: 'word-rookie',
    name: 'Word Rookie',
    desc: '',
    imageUrl: '',
    icon: '🏅',
    xp: 25,
    unlocked: true,
    date: 'Jun 2026',
    rarity: 'Common',
    badgeType: 'LMS',
  },
  {
    id: '2',
    code: 'n5-progress-achiever',
    name: 'N5 Progress Achiever',
    desc: '',
    imageUrl: '',
    icon: '🏅',
    xp: 40,
    unlocked: false,
    date: null,
    rarity: 'Rare',
    badgeType: 'LMS',
  },
  {
    id: '3',
    code: 'n5-high-performer',
    name: 'N5 High Performer',
    desc: '',
    imageUrl: '',
    icon: '🏅',
    xp: 50,
    unlocked: true,
    date: 'Jun 2026',
    rarity: 'Epic',
    badgeType: 'LMS',
  },
  {
    id: '4',
    code: 'n5-perfect-master',
    name: 'N5 Perfect Master',
    desc: '',
    imageUrl: '',
    icon: '🏅',
    xp: 75,
    unlocked: false,
    date: null,
    rarity: 'Legendary',
    badgeType: 'LMS',
  },
];

describe('achievement badge rarity filters', () => {
  test('getBadgeRarityCounts respects status filter', () => {
    expect(getBadgeRarityCounts(SAMPLE_BADGES, 'all')).toEqual({
      all: 4,
      Common: 1,
      Rare: 1,
      Epic: 1,
      Legendary: 1,
    });
    expect(getBadgeRarityCounts(SAMPLE_BADGES, 'unlocked')).toEqual({
      all: 2,
      Common: 1,
      Rare: 0,
      Epic: 1,
      Legendary: 0,
    });
  });

  test('filterAchievementBadges filters by rarity', () => {
    const commonOnly = filterAchievementBadges(SAMPLE_BADGES, 'all', 'Common', 'default');
    expect(commonOnly).toHaveLength(1);
    expect(commonOnly[0]?.code).toBe('word-rookie');

    const epicUnlocked = filterAchievementBadges(SAMPLE_BADGES, 'unlocked', 'Epic', 'default');
    expect(epicUnlocked).toHaveLength(1);
    expect(epicUnlocked[0]?.code).toBe('n5-high-performer');
  });

  test('filter order covers every rarity tier', () => {
    expect(BADGE_RARITY_FILTER_ORDER).toEqual(['Common', 'Rare', 'Epic', 'Legendary']);
  });

  test('buildAchievementBadgeEmptyMessage is contextual', () => {
    expect(buildAchievementBadgeEmptyMessage('locked', 'Legendary')).toContain('Legendary');
    expect(buildAchievementBadgeEmptyMessage('unlocked', 'Rare')).toContain('Rare');
  });
});
