import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { StudentProfilPage } from '@/features/student/components/student-profil-page';
import { loadRecentXpActivity } from '@/lib/lms/xp-activity';

export const metadata: Metadata = {
  title: 'Profil & XP — JepangKu LMS',
  description: 'Statistik XP, level, badge, dan profil belajar kamu.',
};

export default async function DashboardProfilRoutePage() {
  const { userId } = await auth();
  const xpActivity = userId ? await loadRecentXpActivity(userId, 10) : [];

  return <StudentProfilPage xpActivity={xpActivity} />;
}
