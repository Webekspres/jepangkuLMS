import type { Metadata } from 'next';
import { StudentKursusPage } from '@/features/student/components/student-kursus-page';

export const metadata: Metadata = {
  title: 'Kursus Saya — JepangKu LMS',
  description: 'Kursus terdaftar dan katalog JLPT area siswa.',
};

export default function DashboardKursusRoutePage() {
  return <StudentKursusPage />;
}
