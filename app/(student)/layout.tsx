import type { Metadata } from 'next';
import { StudentCoreDataBoundary } from '@/features/student/components/student-core-data-boundary';

export const metadata: Metadata = {
  title: 'Dashboard — JepangKu LMS',
  description: 'Student hub — progress belajar, XP, dan lanjutkan materi JLPT.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <StudentCoreDataBoundary>{children}</StudentCoreDataBoundary>;
}
