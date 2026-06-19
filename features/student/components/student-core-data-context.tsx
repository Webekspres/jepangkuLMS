'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  EMPTY_STUDENT_CORE_DATA,
  toStudentCoreDataContextValue,
  type StudentCoreDataContextValue,
} from '@/features/student/types/student-core-data';

const StudentCoreDataContext = createContext<StudentCoreDataContextValue>(
  toStudentCoreDataContextValue(EMPTY_STUDENT_CORE_DATA, 'loading'),
);

export function StudentCoreDataProvider({
  value,
  children,
}: {
  value: StudentCoreDataContextValue;
  children: ReactNode;
}) {
  return (
    <StudentCoreDataContext.Provider value={value}>{children}</StudentCoreDataContext.Provider>
  );
}

export function useStudentCoreData(): StudentCoreDataContextValue {
  return useContext(StudentCoreDataContext);
}
