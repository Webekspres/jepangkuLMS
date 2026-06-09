'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  EMPTY_STUDENT_CORE_DATA,
  type StudentCoreData,
} from '@/features/student/types/student-core-data';

const StudentCoreDataContext = createContext<StudentCoreData>(EMPTY_STUDENT_CORE_DATA);

export function StudentCoreDataProvider({
  data,
  children,
}: {
  data: StudentCoreData;
  children: ReactNode;
}) {
  return (
    <StudentCoreDataContext.Provider value={data}>{children}</StudentCoreDataContext.Provider>
  );
}

export function useStudentCoreData(): StudentCoreData {
  return useContext(StudentCoreDataContext);
}
