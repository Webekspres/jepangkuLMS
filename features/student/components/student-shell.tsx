import type { ReactNode } from 'react';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { CoreConnectionBanner } from './core-connection-banner';
import { StudentNav } from './student-nav';

type StudentShellProps = {
  children: ReactNode;
};

export function StudentShell({ children }: StudentShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <StudentNav />
      {isCoreIntegrationEnabled() ? <CoreConnectionBanner /> : null}
      <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
