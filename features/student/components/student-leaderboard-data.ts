import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { DASHBOARD_MOCK_USER } from './dashboard-data';

export type LeaderboardEntry = {
  rank: number;
  name: string;
  xp: number;
  avatar: string;
  level: string;
  streakDays: number;
  isYou?: boolean;
};

export const LEADERBOARD_TOTAL_LEARNERS = 32_450;

export const LEADERBOARD_TOP_10: LeaderboardEntry[] = [
  { rank: 1, name: 'Sakura_ID', xp: 12_400, avatar: 'SK', level: 'N3', streakDays: 28 },
  { rank: 2, name: 'Budi_Nihongo', xp: 9_800, avatar: 'BN', level: 'N4', streakDays: 21 },
  { rank: 3, name: 'Anisa_Sensei', xp: 8_450, avatar: 'AS', level: 'N3', streakDays: 19 },
  {
    rank: 4,
    name: DASHBOARD_MOCK_USER.displayName,
    xp: DASHBOARD_MOCK_USER.totalXp,
    avatar: 'KM',
    level: DASHBOARD_MOCK_USER.jlptFocus,
    streakDays: DASHBOARD_MOCK_USER.streakDays,
    isYou: true,
  },
  { rank: 5, name: 'Rio_Kanji', xp: 5_900, avatar: 'RK', level: 'N4', streakDays: 12 },
  { rank: 6, name: 'Maya_N3', xp: 5_420, avatar: 'MN', level: 'N3', streakDays: 9 },
  { rank: 7, name: 'Dian_Hiragana', xp: 4_890, avatar: 'DH', level: 'N5', streakDays: 7 },
  { rank: 8, name: 'Taro_Learn', xp: 4_210, avatar: 'TL', level: 'N4', streakDays: 5 },
  { rank: 9, name: 'Lena_Kanji', xp: 3_650, avatar: 'LK', level: 'N2', streakDays: 4 },
  { rank: 10, name: 'Hiro_Baru', xp: 2_980, avatar: 'HB', level: 'N5', streakDays: 3 },
];

/** Podium: perak | emas | perunggu */
export const LEADERBOARD_PODIUM = [
  LEADERBOARD_TOP_10[1]!,
  LEADERBOARD_TOP_10[0]!,
  LEADERBOARD_TOP_10[2]!,
] as const;

export function getLeaderboardUserContext() {
  const you = LEADERBOARD_TOP_10.find((entry) => entry.isYou)!;
  const above = LEADERBOARD_TOP_10.find((entry) => entry.rank === you.rank - 1);
  const xpToNext = above ? above.xp - you.xp + 1 : 0;

  return {
    rank: you.rank,
    xp: you.xp,
    percentile: 'Top 0,01%',
    xpToNext,
    nextRankName: above?.name,
    totalLearners: LEADERBOARD_TOTAL_LEARNERS,
    totalLearnersLabel: formatDisplayNumber(LEADERBOARD_TOTAL_LEARNERS),
  };
}
