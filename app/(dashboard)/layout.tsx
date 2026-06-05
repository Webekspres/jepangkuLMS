import type { Metadata } from 'next';
import { StudentShell } from '@/features/student/components';

export const metadata: Metadata = {
  title: 'Dashboard — JepangKu LMS',
  description: 'Student hub — progress belajar, XP, dan lanjutkan materi JLPT.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
