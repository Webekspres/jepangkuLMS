const MODULE_PREFIX = /^Modul\s+\d+\s*[—–-]\s*/i;
const LESSON_PREFIX = /^Pelajaran\s+\d+\s*[—–-]\s*/i;

/** Strip manual "Modul 1 —" / "Pelajaran 1 —" prefixes from stored titles. */
export function sanitizeCurriculumTitle(title: string): string {
  return title.replace(MODULE_PREFIX, '').replace(LESSON_PREFIX, '').trim();
}

export function formatModuleDisplayTitle(order: number, title: string): string {
  const clean = sanitizeCurriculumTitle(title);
  return clean ? `Modul ${order} — ${clean}` : `Modul ${order}`;
}

export function formatLessonDisplayTitle(order: number, title: string): string {
  const clean = sanitizeCurriculumTitle(title);
  return clean ? `Pelajaran ${order} — ${clean}` : `Pelajaran ${order}`;
}
