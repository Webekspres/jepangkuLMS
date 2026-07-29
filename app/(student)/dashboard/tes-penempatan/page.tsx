import type { Metadata } from 'next';
import { loadPlacementExamProgress } from '@/features/placement/actions/placement-exam-progress-actions';
import { PlacementHubPage } from '@/features/placement/components/placement-hub-page';
import { loadLatestPlacementAttempt } from '@/features/placement/lib/load-placement-attempt';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';

export const metadata: Metadata = {
  title: 'Tes Penempatan — JepangKu LMS',
  description: 'Uji kemampuan dan dapatkan rekomendasi level JLPT.',
};

export default async function DashboardPlacementPage() {
  const userId = await requireAuthUserId();
  const [latest, inProgress] = await Promise.all([
    loadLatestPlacementAttempt(userId),
    loadPlacementExamProgress(),
  ]);

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
      inProgress={
        inProgress
          ? {
              answeredCount: inProgress.answeredCount,
              updatedAt: inProgress.updatedAt,
            }
          : null
      }
    />
  );
}
