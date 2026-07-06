'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { ensureCoreSessionWithRetry } from '@/features/auth/lib/sync-core-session';
import { requestStudentCoreDataRefresh } from '@/features/student/lib/student-core-data-events';

/**
 * Best-effort Core JWT exchange setelah Clerk login.
 * Dashboard: StudentCoreDataHydrator yang handle; di route lain sync di sini.
 */
export function CoreSessionSync() {
    const router = useRouter();
    const pathname = usePathname();
    const { userId } = useAuth();
    const exchangedForUser = useRef<string | null>(null);

    useEffect(() => {
        if (!isCoreIntegrationEnabled()) return;
        if (pathname?.startsWith('/dashboard')) return;

        if (!userId) {
            exchangedForUser.current = null;
            return;
        }

        if (exchangedForUser.current === userId) return;
        exchangedForUser.current = userId;

        let cancelled = false;

        const run = async () => {
            const ok = await ensureCoreSessionWithRetry();
            if (cancelled) return;
            if (ok) {
                requestStudentCoreDataRefresh();
                router.refresh();
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [router, pathname, userId]);

    return null;
}
