import { StudentCoreDataProvider } from '@/features/student/components/student-core-data-context';
import { StudentShell } from '@/features/student/components/student-shell';
import { loadStudentCoreData } from '@/features/student/lib/load-student-core-data';
import { CoreSessionSync } from '@/features/auth/components/core-session-sync';

/** Server boundary — load Core gamification data, then hydrate client pages. */
export async function StudentCoreDataBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
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
