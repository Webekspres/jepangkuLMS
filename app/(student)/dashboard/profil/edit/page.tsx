import type { Metadata } from 'next';
import { StudentProfilEditPage } from '@/features/student/components/student-profil-edit-page';

export const metadata: Metadata = {
  title: 'Edit Profil — JepangKu LMS',
  description: 'Kelola nama tampilan dan informasi profil belajar kamu.',
};

export default function DashboardProfilEditRoutePage() {
  return <StudentProfilEditPage />;
}
