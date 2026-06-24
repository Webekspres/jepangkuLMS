import { StudentCoreDataHydrator } from '@/features/student/components/student-core-data-hydrator';
import { DisplayNameSetupGate } from '@/features/student/components/display-name-setup-gate';
import { StudentShell } from '@/features/student/components/student-shell';

/** Shell langsung; Core gamification di-hydrate client-side (tidak block SSR halaman LMS). */
export function StudentCoreDataBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentCoreDataHydrator>
      <StudentShell>
        <DisplayNameSetupGate />
        {children}
      </StudentShell>
    </StudentCoreDataHydrator>
  );
}
