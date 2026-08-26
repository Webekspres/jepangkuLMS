import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { LiveClassDetailPage } from '@/features/live-class/components/live-class-detail-page';
import { loadMarketingLiveClassDetail } from '@/features/live-class/lib/load-live-class-detail';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Render at request time — `next build` (CI/Docker) has no PostgreSQL. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const liveClass = await loadMarketingLiveClassDetail(id);

  if (!liveClass) {
    return { title: 'Live Class tidak ditemukan — JepangKu LMS' };
  }

  return {
    title: `${liveClass.title} — Live Class — JepangKu LMS`,
    description: liveClass.description.slice(0, 160),
  };
}

export default async function MarketingLiveClassDetailRoute({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (userId) {
    redirect(STUDENT_ROUTES.liveClassDetail(id));
  }

  const liveClass = await loadMarketingLiveClassDetail(id);
  if (!liveClass) notFound();

  return <LiveClassDetailPage liveClass={liveClass} studentDisplayName={null} variant="marketing" />;
}
