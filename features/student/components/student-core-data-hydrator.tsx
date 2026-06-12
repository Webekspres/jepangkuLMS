'use client';

import { useEffect, useState } from 'react';
import { StudentCoreDataProvider } from '@/features/student/components/student-core-data-context';
import {
  EMPTY_STUDENT_CORE_DATA,
  type StudentCoreData,
} from '@/features/student/types/student-core-data';

type StudentCoreDataHydratorProps = {
  children: React.ReactNode;
};

/** Core gamification dimuat client-side agar halaman LMS tidak menunggu HTTP Core di SSR. */
export function StudentCoreDataHydrator({ children }: StudentCoreDataHydratorProps) {
  const [data, setData] = useState<StudentCoreData>(EMPTY_STUDENT_CORE_DATA);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/student/core-data', { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : EMPTY_STUDENT_CORE_DATA))
      .then((json: StudentCoreData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        // Core down / timeout — tetap pakai empty defaults
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <StudentCoreDataProvider data={data}>{children}</StudentCoreDataProvider>;
}
