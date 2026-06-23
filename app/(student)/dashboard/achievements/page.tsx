import type { Metadata } from 'next';
import { StudentAchievementsPage } from '@/features/student/components/student-achievements-page';
import { loadAchievementMilestones } from '@/features/student/lib/load-dashboard-extras';

export const metadata: Metadata = {
  title: 'Pencapaian — JepangKu LMS',
  description: 'Koleksi badge, milestone JLPT, dan statistik XP siswa.',
};

export default async function DashboardAchievementsRoutePage() {
  const milestones = await loadAchievementMilestones();
  return <StudentAchievementsPage milestones={milestones} />;
}
