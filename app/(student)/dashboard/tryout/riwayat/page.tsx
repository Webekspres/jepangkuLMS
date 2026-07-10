import type { Metadata } from 'next';
import { StudentTryoutHistoryPage } from '@/features/tryout/components/student-tryout-history-page';
import { loadStudentTryoutHistory } from '@/features/tryout/lib/load-student-tryout-history';

export const metadata: Metadata = {
  title: 'Tryout JLPT Saya — JepangKu LMS',
  description: 'Riwayat simulasi JLPT dan analisa hasil ujian kamu.',
};

export default async function TryoutHistoryRoutePage() {
  const items = await loadStudentTryoutHistory();
  return <StudentTryoutHistoryPage items={items} />;
}
