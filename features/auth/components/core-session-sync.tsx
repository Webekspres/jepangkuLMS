'use client';

import { useAuth } from '@clerk/nextjs';
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
    const { userId } = useAuth();
    const exchangedForUser = useRef<string | null>(null);

    useEffect(() => {
        if (!isCoreIntegrationEnabled()) return;

        if (!userId) {
            exchangedForUser.current = null;
            return;
        }

        if (exchangedForUser.current === userId) return;
        exchangedForUser.current = userId;

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
    }, [router, userId]);

    return null;
}
