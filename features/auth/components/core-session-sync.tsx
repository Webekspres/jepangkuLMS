'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { syncCoreSessionSilent } from '@/features/auth/lib/sync-core-session';
import { requestStudentCoreDataRefresh } from '@/features/student/lib/student-core-data-events';

/**
 * Best-effort Core JWT exchange setelah Clerk login.
 * Refresh server data kalau exchange sukses.
 */
export function CoreSessionSync() {
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isCoreIntegrationEnabled()) return;
    if (attempted.current) return;
    attempted.current = true;

    void syncCoreSessionSilent().then((ok) => {
      if (ok) {
        requestStudentCoreDataRefresh();
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
