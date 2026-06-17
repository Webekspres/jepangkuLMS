import {
  LEVEL_ACCENT,
  type CatalogCourse,
  type CourseLevel,
} from '@/features/learning/components/courses-data';
import type { JlptAccent } from '@/features/marketing/components/landing-data';
import type { ModuleRow } from '@/features/learning/lib/course-tree';

const DEFAULT_THUMB =
  'https://images.unsplash.com/photo-1613817048356-ef14b4acc3a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600';

/** Estimasi durasi dari jumlah pelajaran (~20 menit per pelajaran). */
export function estimateCourseDuration(lessonCount: number): string {
  if (lessonCount <= 0) return '—';
  const minutes = lessonCount * 20;
  if (minutes < 60) return `~${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `~${hours} jam ${remainder} menit` : `~${hours} jam`;
}

export function buildWhatYouLearnFromModules(modules: ModuleRow[]): string[] {
  return modules
    .map((mod) => mod.description?.trim() || mod.title.trim())
    .filter(Boolean);
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
  },
): CatalogCourse & { isPublished: boolean; lessonCount: number } {
  const level = db.level as Exclude<CourseLevel, 'Semua'>;
  const accent: JlptAccent = LEVEL_ACCENT[level] ?? 'emerald';

  return {
    slug: db.slug,
    title: db.title,
    level,
    desc: db.description ?? '',
    lessons: db.lessonCount,
    duration: estimateCourseDuration(db.lessonCount),
    availability: db.isPublished ? 'tersedia' : 'segera',
    availabilityLabel: db.isPublished ? 'Tersedia' : 'Segera hadir',
    price: db.isPublished ? 'Gratis' : '—',
    thumb: DEFAULT_THUMB,
    accent,
    badge: level,
    tags: ['Kosa Kata'],
    featured: false,
    isPublished: db.isPublished,
    lessonCount: db.lessonCount,
  };
}

export { DEFAULT_THUMB };
