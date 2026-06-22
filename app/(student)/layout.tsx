import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { StudentCoreDataBoundary } from '@/features/student/components/student-core-data-boundary';

export const metadata: Metadata = {
  title: 'Dashboard — JepangKu LMS',
  description: 'Student hub — progress belajar, XP, dan lanjutkan materi JLPT.',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (userId) {
    await syncUserAnchor(userId).catch(() => undefined);
  }

  return <StudentCoreDataBoundary>{children}</StudentCoreDataBoundary>;
}
