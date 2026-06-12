import type { Metadata } from 'next';
import { DashboardPage } from '@/features/student/components';
import { loadDashboardContinueLessons } from '@/features/student/lib/load-student-learning-data';

export const metadata: Metadata = {
  title: 'Beranda — JepangKu LMS',
  description: 'Student hub — lanjutkan belajar, pantau XP, dan progress JLPT-mu.',
};

export default async function DashboardRoutePage() {
  const continueLessons = await loadDashboardContinueLessons();

  return <DashboardPage continueLessons={continueLessons} />;
}
