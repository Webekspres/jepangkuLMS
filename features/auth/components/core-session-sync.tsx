'use client';

import { useAuth } from '@clerk/nextjs';
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
    const { userId } = useAuth();
    const exchangedForUser = useRef<string | null>(null);

    useEffect(() => {
        if (!isCoreIntegrationEnabled()) return;
        if (!userId) return;
        if (exchangedForUser.current === userId) return;
        exchangedForUser.current = userId;

        void syncCoreSessionSilent().then((ok) => {
            if (ok) {
                requestStudentCoreDataRefresh();
                router.refresh();
            }
        });
    }, [router, userId]);

    return null;
}
