import type { Metadata } from 'next';
import { PlacementHubPage } from '@/features/placement/components/placement-hub-page';
import { loadLatestPlacementAttempt } from '@/features/placement/lib/load-placement-attempt';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';

export const metadata: Metadata = {
  title: 'Tes Penempatan — JepangKu LMS',
  description: 'Uji kemampuan dan dapatkan rekomendasi level JLPT.',
};

export default async function DashboardPlacementPage() {
  const userId = await requireAuthUserId();
  const latest = await loadLatestPlacementAttempt(userId);

  return (
    <PlacementHubPage
      latestAttempt={
        latest
          ? {
              id: latest.id,
              score: latest.score,
              recommendedLevel: latest.recommendedLevel,
              correctCount: latest.correctCount,
              totalQuestions: latest.totalQuestions,
              completedAt: latest.completedAt,
            }
          : null
      }
    />
  );
}
