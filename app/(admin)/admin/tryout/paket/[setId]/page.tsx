import { notFound } from 'next/navigation';
import { AdminJlptPaketDetailPage } from '@/features/admin-cms/components/admin-jlpt-paket-detail-page';
import { loadAdminJlptQuestionSetById } from '@/features/admin-cms/lib/load-admin-jlpt-question-sets';

export default async function AdminTryoutPaketDetailRoutePage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  const detail = await loadAdminJlptQuestionSetById(setId);
  if (!detail) notFound();
  return <AdminJlptPaketDetailPage detail={detail} />;
}
