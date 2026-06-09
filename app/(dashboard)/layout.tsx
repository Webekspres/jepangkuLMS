import type { Metadata } from 'next';
import { CoreSessionSync } from '@/features/auth/components/core-session-sync';
import { StudentCoreDataProvider } from '@/features/student/components/student-core-data-context';
import { StudentShell } from '@/features/student/components';
import { loadStudentCoreData } from '@/features/student/lib/load-student-core-data';

export const metadata: Metadata = {
  title: 'Dashboard — JepangKu LMS',
  description: 'Student hub — progress belajar, XP, dan lanjutkan materi JLPT.',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const coreData = await loadStudentCoreData();

  return (
    <StudentCoreDataProvider data={coreData}>
      <StudentShell>
        <CoreSessionSync />
        {children}
      </StudentShell>
    </StudentCoreDataProvider>
  );
}
