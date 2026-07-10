import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LiveClassDetailPage } from '@/features/live-class/components/live-class-detail-page';
import { loadLiveClassDetail } from '@/features/live-class/lib/load-live-class-detail';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const liveClass = await loadLiveClassDetail(id);
  if (!liveClass) return { title: 'Live Class — JepangKu LMS' };
  return {
    title: `${liveClass.title} — Live Class`,
    description: liveClass.description.slice(0, 160),
  };
}

export default async function LiveClassDetailRoutePage({ params }: PageProps) {
  const { id } = await params;
  const userId = await requireAuthUserId();
  const [liveClass, studentDisplayName] = await Promise.all([
    loadLiveClassDetail(id),
    resolveLmsDisplayName(userId, null),
  ]);
  if (!liveClass) notFound();
  return <LiveClassDetailPage liveClass={liveClass} studentDisplayName={studentDisplayName} />;
}
