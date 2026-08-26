import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { MarketingTryoutDetailPage } from '@/features/tryout/components/marketing-tryout-detail-page';
import { loadMarketingTryoutDetail } from '@/features/tryout/lib/load-marketing-tryout-detail';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

type PageProps = {
  params: Promise<{ sessionCode: string }>;
};

/** Render at request time — `next build` (CI/Docker) has no PostgreSQL. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionCode } = await params;
  const session = await loadMarketingTryoutDetail(sessionCode);

  if (!session) {
    return { title: 'Tryout tidak ditemukan — JepangKu LMS' };
  }

  return {
    title: `${session.title} — Try Out JLPT — JepangKu LMS`,
    description: session.description.slice(0, 160),
  };
}

export default async function MarketingTryoutDetailRoute({ params }: PageProps) {
  const { sessionCode } = await params;
  const { userId } = await auth();

  if (userId) {
    redirect(STUDENT_ROUTES.tryout);
  }

  const session = await loadMarketingTryoutDetail(sessionCode);
  if (!session) notFound();

  return <MarketingTryoutDetailPage session={session} />;
}
