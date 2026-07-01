'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { syncCoreSessionSilent } from '@/features/auth/lib/sync-core-session';
import { requestStudentCoreDataRefresh } from '@/features/student/lib/student-core-data-events';

const RETRY_DELAYS_MS = [0, 2000, 5000, 10000];

/**
 * Best-effort Core JWT exchange setelah Clerk login.
 * Retry beberapa kali — Core webhook/user sync bisa telat beberapa detik.
 */
export function CoreSessionSync() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (!isCoreIntegrationEnabled()) return;
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    const run = async () => {
      for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
        if (cancelled) return;
        const delay = RETRY_DELAYS_MS[i];
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        const ok = await syncCoreSessionSilent();
        if (ok) {
          requestStudentCoreDataRefresh();
          router.refresh();
          return;
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
