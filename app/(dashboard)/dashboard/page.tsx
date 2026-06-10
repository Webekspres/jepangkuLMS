import type { Metadata } from 'next';
import { DashboardPage } from '@/features/student/components';

export const metadata: Metadata = {
  title: 'Beranda — JepangKu LMS',
  description: 'Student hub — lanjutkan belajar, pantau XP, dan progress JLPT-mu.',
};

export default function DashboardRoutePage() {
  return <DashboardPage />;
}
