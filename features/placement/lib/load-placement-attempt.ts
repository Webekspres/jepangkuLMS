import { prisma } from '@/lib/prisma';
import { PLACEMENT_PAPER } from '@/features/placement/data/placement-paper';
import { resolvePlacementLevel } from '@/features/placement/data/placement-score-bands';

export async function loadLatestPlacementAttempt(userId: string) {
  return prisma.placementAttempt.findFirst({
    where: { userId },
    orderBy: { completedAt: 'desc' },
  });
}

export async function loadPlacementAttemptForUser(attemptId: string, userId: string) {
  const attempt = await prisma.placementAttempt.findFirst({
    where: { id: attemptId, userId },
  });
  if (!attempt) return null;

  // Display level/blurb from active bands (score), not stale DB level (e.g. old N2).
  const band = resolvePlacementLevel(attempt.score);
  return {
    attempt,
    paperTitle: PLACEMENT_PAPER.title,
    recommendedLevel: band.level,
    blurb: band.blurb,
  };
}
