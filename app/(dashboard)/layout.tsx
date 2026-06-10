import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StudentCoreDataBoundary } from '@/features/student/components/student-core-data-boundary';
import { StudentLayoutSkeleton } from '@/features/student/components/skeletons';

export const metadata: Metadata = {
  title: 'Dashboard — JepangKu LMS',
  description: 'Student hub — progress belajar, XP, dan lanjutkan materi JLPT.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<StudentLayoutSkeleton />}>
      <StudentCoreDataBoundary>{children}</StudentCoreDataBoundary>
    </Suspense>
  );
}
