'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { StudentCoreDataProvider } from '@/features/student/components/student-core-data-context';
import {
    readCachedStudentCoreData,
    writeCachedStudentCoreData,
} from '@/features/student/lib/student-core-data-cache';
import {
    notifyStudentCoreDataReady,
    STUDENT_CORE_DATA_REFRESH_EVENT,
} from '@/features/student/lib/student-core-data-events';
import { ensureCoreSessionWithRetry } from '@/features/auth/lib/sync-core-session';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import {
    EMPTY_STUDENT_CORE_DATA,
    toStudentCoreDataContextValue,
    type StudentCoreData,
    type StudentCoreDataContextValue,
} from '@/features/student/types/student-core-data';

type StudentCoreDataHydratorProps = {
    children: React.ReactNode;
};

function defaultContextValue(): StudentCoreDataContextValue {
    return toStudentCoreDataContextValue(EMPTY_STUDENT_CORE_DATA, 'loading', false);
}

async function fetchCoreData(): Promise<StudentCoreData> {
    const response = await fetch('/api/student/core-data', { credentials: 'same-origin' });
    return response.ok ? ((await response.json()) as StudentCoreData) : EMPTY_STUDENT_CORE_DATA;
}

/** Core gamification dimuat client-side agar halaman LMS tidak menunggu HTTP Core di SSR. */
export function StudentCoreDataHydrator({ children }: StudentCoreDataHydratorProps) {
    const { userId: clerkUserId } = useAuth();
    const [value, setValue] = useState<StudentCoreDataContextValue>(() => defaultContextValue());
    const syncAttempted = useRef(false);

    useEffect(() => {
        let cancelled = false;
        syncAttempted.current = false;

        queueMicrotask(() => {
            const cached = readCachedStudentCoreData(clerkUserId);
            if (cached?.coreConnected && !cancelled) {
                setValue(toStudentCoreDataContextValue(cached, 'ready', false));
                notifyStudentCoreDataReady();
            }
        });

        const markReady = (json: StudentCoreData, coreSyncWarning: boolean) => {
            if (json.coreConnected) {
                writeCachedStudentCoreData(json);
            }
            setValue(toStudentCoreDataContextValue(json, 'ready', coreSyncWarning));
            notifyStudentCoreDataReady();
        };

        const load = async (coreSyncWarning = false) => {
            try {
                const json = await fetchCoreData();
                if (!cancelled) {
                    markReady(json, coreSyncWarning);
                }
            } catch {
                if (!cancelled) {
                    setValue((current) => ({ ...current, status: 'ready', coreSyncWarning }));
                    notifyStudentCoreDataReady();
                }
            }
        };

        const tryCoreSyncThenLoad = async () => {
            const integrationOn = isCoreIntegrationEnabled();
            if (!integrationOn) {
                await load(false);
                return;
            }

            if (!syncAttempted.current) {
                syncAttempted.current = true;
                const synced = await ensureCoreSessionWithRetry();
                const json = await fetchCoreData();
                if (cancelled) return;
                markReady(json, !json.coreConnected && !synced);
                return;
            }

            await load(false);
        };

        void tryCoreSyncThenLoad();

        const onRefresh = () => {
            void (async () => {
                if (isCoreIntegrationEnabled()) {
                    await ensureCoreSessionWithRetry();
                }
                await load(false);
            })();
        };
        window.addEventListener(STUDENT_CORE_DATA_REFRESH_EVENT, onRefresh);

        return () => {
            cancelled = true;
            window.removeEventListener(STUDENT_CORE_DATA_REFRESH_EVENT, onRefresh);
        };
    }, [clerkUserId]);

    return <StudentCoreDataProvider value={value}>{children}</StudentCoreDataProvider>;
}
