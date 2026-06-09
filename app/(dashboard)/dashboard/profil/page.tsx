import type { Metadata } from 'next';
import { StudentProfilPage } from '@/features/student/components/student-profil-page';

export const metadata: Metadata = {
  title: 'Profil & XP — JepangKu LMS',
  description: 'Statistik XP, level, badge, dan profil belajar kamu.',
};

export default function DashboardProfilRoutePage() {
  return <StudentProfilPage />;
}
