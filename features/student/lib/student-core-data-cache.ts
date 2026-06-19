import {
  EMPTY_STUDENT_CORE_DATA,
  type StudentCoreData,
} from '@/features/student/types/student-core-data';

const STORAGE_KEY = 'jepangku-student-core-data-v1';

let memoryCache: StudentCoreData | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/** Snapshot terakhir yang sukses — dipakai agar navigasi dashboard tidak flash banner. */
export function readCachedStudentCoreData(): StudentCoreData | null {
  if (memoryCache?.coreConnected) return memoryCache;

  if (!isBrowser()) return memoryCache;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryCache;
    const parsed = JSON.parse(raw) as StudentCoreData;
    if (parsed.coreConnected) {
      memoryCache = parsed;
      return parsed;
    }
  } catch {
    // corrupt cache — abaikan
  }

  return memoryCache;
}

export function writeCachedStudentCoreData(data: StudentCoreData): void {
  if (!data.coreConnected) return;

  memoryCache = data;

  if (!isBrowser()) return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota / private mode
  }
}

export function clearCachedStudentCoreData(): void {
  memoryCache = null;
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getInitialStudentCoreData(): StudentCoreData {
  return readCachedStudentCoreData() ?? EMPTY_STUDENT_CORE_DATA;
}
