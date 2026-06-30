import type { CourseCategoryType } from '@prisma/client';

export const COURSE_CATEGORY_TYPE_OPTIONS: {
  value: CourseCategoryType;
  label: string;
}[] = [
  { value: 'KURSUS_UTAMA', label: 'Kursus Utama' },
  { value: 'KURSUS_GRATIS', label: 'Kursus Gratis' },
  { value: 'KURSUS_TAMBAHAN', label: 'Kursus Tambahan' },
];

const LABEL_BY_VALUE: Record<CourseCategoryType, string> = {
  KURSUS_UTAMA: 'Kursus Utama',
  KURSUS_GRATIS: 'Kursus Gratis',
  KURSUS_TAMBAHAN: 'Kursus Tambahan',
};

export function courseCategoryTypeLabel(type: CourseCategoryType): string {
  return LABEL_BY_VALUE[type] ?? 'Kursus Utama';
}

/** Parse Excel / form label into enum; defaults to KURSUS_UTAMA when ambiguous. */
export function parseCourseCategoryType(raw: string): CourseCategoryType {
  const v = raw.trim().toLowerCase();
  if (!v) return 'KURSUS_UTAMA';

  const enumKey = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (enumKey === 'KURSUS_GRATIS' || enumKey === 'KURSUS_UTAMA' || enumKey === 'KURSUS_TAMBAHAN') {
    return enumKey;
  }

  if (v.includes('gratis')) return 'KURSUS_GRATIS';
  if (v.includes('tambahan')) return 'KURSUS_TAMBAHAN';
  return 'KURSUS_UTAMA';
}

/** Comma-separated outcomes cell → clean String[] (max 20). */
export function parseOutcomesFromCommaList(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 20);
}
