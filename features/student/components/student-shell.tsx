'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { CoreConnectionBanner } from './core-connection-banner';
import { StudentNav } from './student-nav';
import { TryoutReviewShell } from '@/features/tryout/components/tryout-focus-shell';

type StudentShellProps = {
  children: ReactNode;
};

function isTryoutReviewPath(pathname: string) {
  return /^\/dashboard\/tryout\/hasil\/[^/]+$/.test(pathname);
}

/** Exam path uses TryoutFocusShell inside workspace — no dashboard nav. */
function isTryoutExamPath(pathname: string) {
  return /^\/dashboard\/tryout\/[^/]+\/[^/]+$/.test(pathname) && !pathname.includes('/hasil');
}

export function StudentShell({ children }: StudentShellProps) {
  const pathname = usePathname();

  if (isTryoutExamPath(pathname)) {
    return <>{children}</>;
  }

  if (isTryoutReviewPath(pathname)) {
    return <TryoutReviewShell>{children}</TryoutReviewShell>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <StudentNav />
      {isCoreIntegrationEnabled() ? <CoreConnectionBanner /> : null}
      <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
