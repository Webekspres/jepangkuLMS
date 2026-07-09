import type { Metadata } from 'next';
import { StudentKursusPage } from '@/features/student/components/student-kursus-page';
import { loadStudentKursusData } from '@/features/student/lib/load-student-learning-data';

export const metadata: Metadata = {
  title: 'Katalog Kursus — JepangKu LMS',
  description: 'Jelajahi dan daftar kursus JLPT N5–N1 di JepangKu LMS.',
};

export default async function DashboardKursusRoutePage() {
  const data = await loadStudentKursusData();

  return (
    <StudentKursusPage
      courses={data.courses}
      enrollmentBySlug={data.enrollmentBySlug}
    />
  );
}
