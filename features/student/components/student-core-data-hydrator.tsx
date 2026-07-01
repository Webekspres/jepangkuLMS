'use client';

import { useEffect, useRef, useState } from 'react';
import { StudentCoreDataProvider } from '@/features/student/components/student-core-data-context';
import {
    readCachedStudentCoreData,
    writeCachedStudentCoreData,
} from '@/features/student/lib/student-core-data-cache';
import { STUDENT_CORE_DATA_REFRESH_EVENT } from '@/features/student/lib/student-core-data-events';
import { syncCoreSessionSilent } from '@/features/auth/lib/sync-core-session';
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

const CORE_SYNC_RETRY_MS = [0, 2500, 6000, 12000];

function defaultContextValue(): StudentCoreDataContextValue {
    return toStudentCoreDataContextValue(EMPTY_STUDENT_CORE_DATA, 'loading', false);
}

async function fetchCoreData(): Promise<StudentCoreData> {
    const response = await fetch('/api/student/core-data', { credentials: 'same-origin' });
    return response.ok ? ((await response.json()) as StudentCoreData) : EMPTY_STUDENT_CORE_DATA;
}

/** Core gamification dimuat client-side agar halaman LMS tidak menunggu HTTP Core di SSR. */
export function StudentCoreDataHydrator({ children }: StudentCoreDataHydratorProps) {
    const [value, setValue] = useState<StudentCoreDataContextValue>(() => defaultContextValue());
    const syncAttempted = useRef(false);

    useEffect(() => {
        let cancelled = false;

        queueMicrotask(() => {
            const cached = readCachedStudentCoreData();
            if (cached?.coreConnected && !cancelled) {
                setValue(toStudentCoreDataContextValue(cached, 'ready', false));
            }
        });

        const applyData = (json: StudentCoreData, coreSyncWarning: boolean) => {
            if (json.coreConnected) {
                writeCachedStudentCoreData(json);
            }
            setValue(toStudentCoreDataContextValue(json, 'ready', coreSyncWarning));
        };

        const load = async (coreSyncWarning = false) => {
            try {
                const json = await fetchCoreData();
                if (!cancelled) {
                    applyData(json, coreSyncWarning);
                }
            } catch {
                if (!cancelled) {
                    setValue((current) => ({ ...current, status: 'ready', coreSyncWarning }));
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
                for (const delay of CORE_SYNC_RETRY_MS) {
                    if (cancelled) return;
                    if (delay > 0) {
                        await new Promise((resolve) => setTimeout(resolve, delay));
                    }
                    const ok = await syncCoreSessionSilent();
                    const json = await fetchCoreData();
                    if (cancelled) return;
                    if (json.coreConnected) {
                        applyData(json, false);
                        return;
                    }
                    if (ok) {
                        applyData(json, false);
                        return;
                    }
                }
                const final = await fetchCoreData();
                if (!cancelled) {
                    applyData(final, !final.coreConnected);
                }
                return;
            }

            await load(false);
        };

        void tryCoreSyncThenLoad();

        const onRefresh = () => {
            void load(false);
        };
        window.addEventListener(STUDENT_CORE_DATA_REFRESH_EVENT, onRefresh);

        return () => {
            cancelled = true;
            window.removeEventListener(STUDENT_CORE_DATA_REFRESH_EVENT, onRefresh);
        };
    }, []);

    return <StudentCoreDataProvider value={value}>{children}</StudentCoreDataProvider>;
}
