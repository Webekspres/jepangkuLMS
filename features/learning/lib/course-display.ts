import {
  CATALOG_COURSES,
  LEVEL_ACCENT,
  type CatalogCourse,
  type CourseLevel,
} from '@/features/learning/components/courses-data';
import type { JlptAccent } from '@/features/marketing/components/landing-data';

const catalogBySlug = Object.fromEntries(CATALOG_COURSES.map((c) => [c.slug, c]));

/** Gabung metadata marketing (thumb, accent) dengan data DB course. */
export function mergeCourseDisplay(
  db: {
    slug: string;
    title: string;
    description: string | null;
    level: string;
    isPublished: boolean;
    lessonCount: number;
  },
): CatalogCourse & { isPublished: boolean; lessonCount: number } {
  const catalog = catalogBySlug[db.slug];
  const level = db.level as Exclude<CourseLevel, 'Semua'>;
  const accent: JlptAccent = catalog?.accent ?? LEVEL_ACCENT[level] ?? 'emerald';

  return {
    slug: db.slug,
    title: db.title,
    level,
    desc: db.description ?? catalog?.desc ?? '',
    lessons: db.lessonCount || catalog?.lessons || 0,
    duration: catalog?.duration ?? '—',
    availability: db.isPublished ? 'tersedia' : 'segera',
    availabilityLabel: db.isPublished
      ? (catalog?.availabilityLabel ?? 'Tersedia')
      : (catalog?.availabilityLabel ?? 'Segera hadir'),
    price: catalog?.price ?? '—',
    thumb:
      catalog?.thumb ??
      'https://images.unsplash.com/photo-1613817048356-ef14b4acc3a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    accent,
    badge: catalog?.badge ?? level,
    tags: catalog?.tags ?? ['Kosa Kata'],
    featured: catalog?.featured ?? false,
    isPublished: db.isPublished,
    lessonCount: db.lessonCount,
  };
}

export function getCatalogCourse(slug: string): CatalogCourse | undefined {
  return catalogBySlug[slug];
}
