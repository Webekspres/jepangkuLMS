import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { ensureCoreJwtCookie } from '@/lib/auth/ensure-core-jwt';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { StudentCoreDataBoundary } from '@/features/student/components/student-core-data-boundary';

/** Student dashboard — DB/Clerk at request time; CI build has no PostgreSQL. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard — JepangKu LMS',
  description: 'Student hub — progress belajar, XP, dan lanjutkan materi JLPT.',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (userId) {
    await syncUserAnchor(userId).catch(() => undefined);
    await ensureCoreJwtCookie().catch(() => false);
  }

  return <StudentCoreDataBoundary>{children}</StudentCoreDataBoundary>;
}
