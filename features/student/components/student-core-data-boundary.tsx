import { StudentCoreDataHydrator } from '@/features/student/components/student-core-data-hydrator';
import { StudentShell } from '@/features/student/components/student-shell';
import { CoreSessionSync } from '@/features/auth/components/core-session-sync';

/** Shell langsung; Core gamification di-hydrate client-side (tidak block SSR halaman LMS). */
export function StudentCoreDataBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentCoreDataHydrator>
      <StudentShell>
        <CoreSessionSync />
        {children}
      </StudentShell>
    </StudentCoreDataHydrator>
  );
}
