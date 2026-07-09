import type { Metadata } from 'next';
import { StudentKursusSayaPage } from '@/features/student/components/student-kursus-saya-page';
import { loadStudentKursusData } from '@/features/student/lib/load-student-learning-data';

export const metadata: Metadata = {
  title: 'Kursus Saya — JepangKu LMS',
  description: 'Daftar kursus JLPT yang sedang kamu ikuti di JepangKu LMS.',
};

export default async function DashboardKursusSayaRoutePage() {
  const data = await loadStudentKursusData();

  return <StudentKursusSayaPage enrolledCards={data.enrolledCards} />;
}
