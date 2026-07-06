import type { Metadata } from 'next';
import { StudentKursusPage } from '@/features/student/components/student-kursus-page';
import { loadStudentKursusData } from '@/features/student/lib/load-student-learning-data';

export const metadata: Metadata = {
  title: 'Kursus Saya — JepangKu LMS',
  description: 'Kursus terdaftar dan katalog JLPT area siswa.',
};

export default async function DashboardKursusRoutePage() {
  const data = await loadStudentKursusData();

  return (
    <StudentKursusPage
      courses={data.courses}
      enrollmentBySlug={data.enrollmentBySlug}
      enrolledCards={data.enrolledCards}
      stats={data.stats}
    />
  );
}
