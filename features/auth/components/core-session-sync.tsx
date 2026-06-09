'use client';

import { useEffect, useRef } from 'react';
import { syncCoreSessionSilent } from '@/features/auth/lib/sync-core-session';

/**
 * Best-effort Core JWT exchange after Clerk login (shadow mode, seperti Portal Berita).
 * Tidak memblokir dashboard jika Core belum siap.
 */
export function CoreSessionSync() {
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    void syncCoreSessionSilent();
  }, []);

  return null;
}
