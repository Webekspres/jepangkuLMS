import type { Metadata } from 'next';
import { PlacementExamWorkspace } from '@/features/placement/components/placement-exam-workspace';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';

export const metadata: Metadata = {
  title: 'Ujian Tes Penempatan — JepangKu LMS',
  description: 'Kerjakan tes penempatan diagnostik JepangKu.',
};

export default async function DashboardPlacementExamPage() {
  await requireAuthUserWithAnchor();
  return <PlacementExamWorkspace />;
}
