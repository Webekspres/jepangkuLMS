'use client';

import { useEffect, useState } from 'react';
import { StudentCoreDataProvider } from '@/features/student/components/student-core-data-context';
import {
    readCachedStudentCoreData,
    writeCachedStudentCoreData,
} from '@/features/student/lib/student-core-data-cache';
import { STUDENT_CORE_DATA_REFRESH_EVENT } from '@/features/student/lib/student-core-data-events';
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
    return toStudentCoreDataContextValue(EMPTY_STUDENT_CORE_DATA, 'loading');
}

/** Core gamification dimuat client-side agar halaman LMS tidak menunggu HTTP Core di SSR. */
export function StudentCoreDataHydrator({ children }: StudentCoreDataHydratorProps) {
    const [value, setValue] = useState<StudentCoreDataContextValue>(() => defaultContextValue());

    useEffect(() => {
        let cancelled = false;

        queueMicrotask(() => {
            const cached = readCachedStudentCoreData();
            // #region agent log
            fetch('http://127.0.0.1:7586/ingest/265dc3a3-e6c3-431c-a1a4-936dc8bd56f0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd34769' }, body: JSON.stringify({ sessionId: 'd34769', location: 'student-core-data-hydrator.tsx:cache-read', message: 'hydrator cache read', data: { hasCache: Boolean(cached), cacheUserId: cached?.userId ?? null, cacheDisplayName: cached?.displayName ?? null, cachePoints: cached?.lmsPoints ?? null, cacheCoreConnected: cached?.coreConnected ?? false }, timestamp: Date.now(), hypothesisId: 'B' }) }).catch(() => { });
            // #endregion
            if (cached?.coreConnected && !cancelled) {
                setValue(toStudentCoreDataContextValue(cached, 'ready'));
            }
        });

        const load = () => {
            fetch('/api/student/core-data', { credentials: 'same-origin' })
                .then((response) => (response.ok ? response.json() : EMPTY_STUDENT_CORE_DATA))
                .then((json: StudentCoreData) => {
                    if (cancelled) return;
                    // #region agent log
                    fetch('http://127.0.0.1:7586/ingest/265dc3a3-e6c3-431c-a1a4-936dc8bd56f0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd34769' }, body: JSON.stringify({ sessionId: 'd34769', location: 'student-core-data-hydrator.tsx:api-response', message: 'hydrator API response', data: { apiUserId: json.userId ?? null, apiDisplayName: json.displayName ?? null, apiPoints: json.lmsPoints ?? null, apiRank: json.lmsRank ?? null, apiCoreConnected: json.coreConnected }, timestamp: Date.now(), hypothesisId: 'B,E' }) }).catch(() => { });
                    // #endregion
                    if (json.coreConnected) {
                        writeCachedStudentCoreData(json);
                    }
                    setValue(toStudentCoreDataContextValue(json, 'ready'));
                })
                .catch(() => {
                    if (!cancelled) {
                        setValue((current) => ({ ...current, status: 'ready' }));
                    }
                });
        };

        load();

        const onRefresh = () => load();
        window.addEventListener(STUDENT_CORE_DATA_REFRESH_EVENT, onRefresh);

        return () => {
            cancelled = true;
            window.removeEventListener(STUDENT_CORE_DATA_REFRESH_EVENT, onRefresh);
        };
    }, []);

    return <StudentCoreDataProvider value={value}>{children}</StudentCoreDataProvider>;
}
