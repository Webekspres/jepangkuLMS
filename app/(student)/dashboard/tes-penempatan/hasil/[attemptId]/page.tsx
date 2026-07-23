import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PlacementResultPage } from '@/features/placement/components/placement-result-page';
import { loadPlacementAttemptForUser } from '@/features/placement/lib/load-placement-attempt';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';

type PageProps = {
  params: Promise<{ attemptId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { attemptId } = await params;
  return {
    title: `Hasil Tes Penempatan — JepangKu LMS`,
    description: `Hasil attempt ${attemptId}`,
  };
}

export default async function DashboardPlacementResultPage({ params }: PageProps) {
  const { attemptId } = await params;
  const userId = await requireAuthUserId();
  const data = await loadPlacementAttemptForUser(decodeURIComponent(attemptId), userId);
  if (!data) notFound();

  return (
    <PlacementResultPage
      attemptId={data.attempt.id}
      score={data.attempt.score}
      correctCount={data.attempt.correctCount}
      totalQuestions={data.attempt.totalQuestions}
      recommendedLevel={data.recommendedLevel}
      blurb={data.blurb}
      paperTitle={data.paperTitle}
      completedAt={data.attempt.completedAt}
    />
  );
}
