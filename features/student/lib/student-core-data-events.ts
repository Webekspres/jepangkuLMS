export const STUDENT_CORE_DATA_REFRESH_EVENT = 'student-core-data:refresh';

export function requestStudentCoreDataRefresh(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(STUDENT_CORE_DATA_REFRESH_EVENT));
}
