import type { CourseCategoryType } from '@prisma/client';
import {
  LEVEL_ACCENT,
  type CatalogCourse,
  type CourseLevel,
} from '@/features/learning/components/courses-data';
import type { JlptAccent } from '@/features/marketing/components/landing-data';
import { courseCategoryTypeLabel } from '@/lib/lms/course-category';
import { formatIdr } from '@/lib/lms/format-price';

const DEFAULT_THUMB = '/assets/bg-courses.webp';

/** Estimasi durasi dari jumlah pelajaran (~20 menit per pelajaran). */
export function estimateCourseDuration(lessonCount: number): string {
  if (lessonCount <= 0) return '—';
  const minutes = lessonCount * 20;
  if (minutes < 60) return `~${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `~${hours} jam ${remainder} menit` : `~${hours} jam`;
}

/** Gabung data kursus dari DB — tanpa overlay katalog statis. */
export function mergeCourseDisplay(
  db: {
    slug: string;
    title: string;
    description: string | null;
    level: string;
    isPublished: boolean;
    lessonCount: number;
    priceIdr?: number;
    category?: CourseCategoryType | null;
    isFeatured?: boolean;
  },
): CatalogCourse & { isPublished: boolean; lessonCount: number; priceIdr: number } {
  const level = db.level as Exclude<CourseLevel, 'Semua'>;
  const accent: JlptAccent = LEVEL_ACCENT[level] ?? 'emerald';
  const priceIdr = db.priceIdr ?? 0;
  const categoryLabel = courseCategoryTypeLabel(db.category ?? 'KURSUS_UTAMA');

  return {
    slug: db.slug,
    title: db.title,
    level,
    desc: db.description ?? '',
    lessons: db.lessonCount,
    duration: estimateCourseDuration(db.lessonCount),
    availability: db.isPublished ? 'tersedia' : 'segera',
    availabilityLabel: db.isPublished ? 'Tersedia' : 'Segera hadir',
    price: db.isPublished ? formatIdr(priceIdr) : '—',
    thumb: DEFAULT_THUMB,
    accent,
    badge: level,
    tags: [categoryLabel],
    categoryType: db.category ?? 'KURSUS_UTAMA',
    featured: db.isFeatured ?? false,
    isPublished: db.isPublished,
    lessonCount: db.lessonCount,
    priceIdr,
  };
}

export { DEFAULT_THUMB };
