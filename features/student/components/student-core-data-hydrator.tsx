'use client';

import { useEffect, useState } from 'react';
import { StudentCoreDataProvider } from '@/features/student/components/student-core-data-context';
import {
  readCachedStudentCoreData,
  writeCachedStudentCoreData,
} from '@/features/student/lib/student-core-data-cache';
import { STUDENT_CORE_DATA_REFRESH_EVENT } from '@/features/student/lib/student-core-data-events';
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
  return toStudentCoreDataContextValue(EMPTY_STUDENT_CORE_DATA, 'loading');
}

/** Core gamification dimuat client-side agar halaman LMS tidak menunggu HTTP Core di SSR. */
export function StudentCoreDataHydrator({ children }: StudentCoreDataHydratorProps) {
  const [value, setValue] = useState<StudentCoreDataContextValue>(() => defaultContextValue());

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      const cached = readCachedStudentCoreData();
      if (cached?.coreConnected && !cancelled) {
        setValue(toStudentCoreDataContextValue(cached, 'ready'));
      }
    });

    const load = () => {
      fetch('/api/student/core-data', { credentials: 'same-origin' })
        .then((response) => (response.ok ? response.json() : EMPTY_STUDENT_CORE_DATA))
        .then((json: StudentCoreData) => {
          if (cancelled) return;

          const isEnabled = isCoreIntegrationEnabled();
          if (isEnabled && !json.coreConnected) {
            if (process.env.NODE_ENV === 'production') {
              window.location.href = '/maintenance?reason=core_offline';
              return;
            } else {
              console.warn('⚠️ Core service offline. Development bypass active.');
            }
          }

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
