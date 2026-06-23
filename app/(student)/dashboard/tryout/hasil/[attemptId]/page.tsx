import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TryoutReviewPage } from '@/features/tryout/components/tryout-review-page';
import { loadTryoutAttemptReview } from '@/features/tryout/lib/load-tryout-review';

type PageProps = {
  params: Promise<{ attemptId: string }>;
};

export const metadata: Metadata = {
  title: 'Hasil Tryout JLPT — JepangKu LMS',
  description: 'Analisa jawaban dan penjelasan simulasi JLPT.',
};

export default async function TryoutResultRoutePage({ params }: PageProps) {
  const { attemptId } = await params;
  const review = await loadTryoutAttemptReview(attemptId);
  if (!review) notFound();

  return <TryoutReviewPage review={review} />;
}
