'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { CoreConnectionBanner } from './core-connection-banner';
import { StudentNav } from './student-nav';
import { TryoutReviewShell } from '@/features/tryout/components/tryout-focus-shell';
import { KanaFloatingLauncher } from '@/features/kana/components/kana-floating-launcher';

type StudentShellProps = {
  children: ReactNode;
};

function isTryoutReviewPath(pathname: string) {
  return /^\/dashboard\/tryout\/hasil\/[^/]+$/.test(pathname);
}

function isPlacementExamPath(pathname: string) {
  return pathname === '/dashboard/tes-penempatan/ujian';
}

function isPlacementResultPath(pathname: string) {
  return /^\/dashboard\/tes-penempatan\/hasil\/[^/]+$/.test(pathname);
}

/** Static tryout routes that are not exam sessions. */
const TRYOUT_STATIC_SEGMENTS = new Set(['hasil', 'riwayat']);

/** Exam path uses TryoutFocusShell inside workspace — no dashboard nav. */
function isTryoutExamPath(pathname: string) {
  const match = pathname.match(/^\/dashboard\/tryout\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return false;
  if (TRYOUT_STATIC_SEGMENTS.has(match[1])) return false;
  return true;
}

export function StudentShell({ children }: StudentShellProps) {
  const pathname = usePathname();

  if (isTryoutExamPath(pathname) || isPlacementExamPath(pathname) || isPlacementResultPath(pathname)) {
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
      <KanaFloatingLauncher />
    </div>
  );
}
