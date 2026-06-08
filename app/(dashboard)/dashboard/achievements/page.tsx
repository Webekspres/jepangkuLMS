import type { Metadata } from 'next';
import { StudentAchievementsPage } from '@/features/student/components/student-achievements-page';

export const metadata: Metadata = {
  title: 'Pencapaian — JepangKu LMS',
  description: 'Koleksi badge, milestone JLPT, dan statistik XP siswa.',
};

export default function DashboardAchievementsRoutePage() {
  return <StudentAchievementsPage />;
}
