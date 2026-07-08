export const STUDENT_CORE_DATA_REFRESH_EVENT = 'student-core-data:refresh';
export const STUDENT_CORE_DATA_READY_EVENT = 'student-core-data:ready';

export function requestStudentCoreDataRefresh(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(STUDENT_CORE_DATA_REFRESH_EVENT));
}

export function notifyStudentCoreDataReady(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(STUDENT_CORE_DATA_READY_EVENT));
}
