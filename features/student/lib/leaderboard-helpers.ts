import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import type { StudentLeaderboardEntry } from '@/features/student/types/student-core-data';

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function getLeaderboardUserContext(
  top10: StudentLeaderboardEntry[],
  options: {
    lmsRank: number | null;
    lmsPoints: number;
    leaderboardTotal: number;
  },
) {
  const you = top10.find((entry) => entry.isYou);
  const rank = you?.rank ?? options.lmsRank ?? 0;
  const points = you?.points ?? options.lmsPoints;

  let pointsToNext = 0;
  let nextRankName: string | undefined;

  if (you && you.rank > 1) {
    const above = top10.find((entry) => entry.rank === you.rank - 1);
    if (above) {
      pointsToNext = Math.max(0, above.points - points + 1);
      nextRankName = above.name;
    }
  } else if (options.lmsRank != null && options.lmsRank > 1) {
    const above = top10.find((entry) => entry.rank === options.lmsRank! - 1);
    if (above) {
      pointsToNext = Math.max(0, above.points - points + 1);
      nextRankName = above.name;
    }
  }

  const totalLearners = options.leaderboardTotal;
  const percentile =
    rank > 0 && totalLearners > 0
      ? `Top ${Math.max(1, Math.round((rank / totalLearners) * 100))}%`
      : '—';

  return {
    rank: rank || null,
    points,
    percentile,
    pointsToNext,
    nextRankName,
    totalLearners,
    totalLearnersLabel: formatDisplayNumber(totalLearners),
  };
}

export function getLeaderboardPodium(top10: StudentLeaderboardEntry[]): StudentLeaderboardEntry[] {
  if (top10.length < 3) return top10.slice(0, 3);
  return [top10[1]!, top10[0]!, top10[2]!];
}
