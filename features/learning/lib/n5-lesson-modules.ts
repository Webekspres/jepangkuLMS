import type { CourseSyllabusModule } from '@/features/learning/components/course-detail-data';
import {
  N5_ALL_LESSONS,
  type N5LessonDef,
  type N5Module,
} from '@/prisma/lib/n5-curriculum';

export const N5_MODULE_META: Record<
  N5Module,
  { title: string; subtitle: string; order: number }
> = {
  aksara: {
    title: 'Modul 1 — Hiragana & Katakana',
    subtitle: '6 pelajaran · fondasi aksara Jepang',
    order: 1,
  },
  kanji: {
    title: 'Modul 2 — Kanji N5',
    subtitle: '11 topik kanji per kategori',
    order: 2,
  },
  kosakata: {
    title: 'Modul 3 — Kosakata N5',
    subtitle: '20 topik kosakata tematik',
    order: 3,
  },
  'tata-bahasa': {
    title: 'Modul 4 — Tata Bahasa N5',
    subtitle: '19 pola tata bahasa',
    order: 4,
  },
  kuis: {
    title: 'Modul 5 — Kuis Latihan',
    subtitle: '2 set kuis pilihan ganda',
    order: 5,
  },
  tryout: {
    title: 'Modul 6 — Try Out & Simulasi',
    subtitle: 'Placement test + simulasi JLPT N5',
    order: 6,
  },
};

const N5_MODULE_ORDER: N5Module[] = [
  'aksara',
  'kanji',
  'kosakata',
  'tata-bahasa',
  'kuis',
  'tryout',
];

const N5_LESSON_MODULE_BY_SLUG = new Map(
  N5_ALL_LESSONS.map((lesson) => [lesson.slug, lesson.module]),
);

/** Tentukan modul dari slug lesson — selaras dengan seed N5. */
export function inferLessonModule(slug: string): N5Module {
  const fromCurriculum = N5_LESSON_MODULE_BY_SLUG.get(slug);
  if (fromCurriculum) return fromCurriculum;
  if (slug.startsWith('kanji-n5')) return 'kanji';
  if (slug.startsWith('kosakata-n5')) return 'kosakata';
  if (slug.startsWith('tata-bahasa-n5')) return 'tata-bahasa';
  if (slug.startsWith('kuis-')) return 'kuis';
  if (slug.startsWith('tryout-')) return 'tryout';
  if (
    slug.includes('hiragana') ||
    slug.includes('katakana') ||
    slug.includes('aksara')
  ) {
    return 'aksara';
  }
  return 'aksara';
}

export type GroupedLesson<T> = {
  /** Id unik modul — biasanya slug N5Module */
  module: string;
  title: string;
  subtitle: string;
  lessons: T[];
};

export function groupLessonsByModule<T extends { slug: string; order: number }>(
  lessons: T[],
): GroupedLesson<T>[] {
  const buckets = new Map<N5Module, T[]>();

  for (const lesson of [...lessons].sort((a, b) => a.order - b.order)) {
    const module = inferLessonModule(lesson.slug);
    const list = buckets.get(module) ?? [];
    list.push(lesson);
    buckets.set(module, list);
  }

  return N5_MODULE_ORDER.filter((module) => buckets.has(module)).map((module) => ({
    module,
    title: N5_MODULE_META[module].title,
    subtitle: N5_MODULE_META[module].subtitle,
    lessons: buckets.get(module)!,
  }));
}

/** Silabus marketing N5 — 6 modul dari kurikulum resmi Phase 1. */
export function buildN5MarketingSyllabus(): CourseSyllabusModule[] {
  const grouped = groupLessonsByModule(
    N5_ALL_LESSONS.map((lesson) => ({
      slug: lesson.slug,
      title: lesson.title,
      order: lesson.order,
    })),
  );

  return grouped.map((group, groupIndex) => ({
    title: group.title,
    items: group.lessons.map((lesson, lessonIndex) => ({
      title: lesson.title,
      duration: estimateLessonDuration(lesson.slug),
      locked: groupIndex > 0 || lessonIndex > 1,
    })),
  }));
}

function estimateLessonDuration(slug: string): string {
  const module = inferLessonModule(slug);
  if (module === 'tryout') return '60 menit';
  if (module === 'kuis') return '30 menit';
  if (module === 'aksara') return '15 menit';
  return '20 menit';
}

export function getDefaultExpandedModuleIds(
  groups: GroupedLesson<{ slug: string }>[],
  continueLessonSlug?: string | null,
): string[] {
  if (continueLessonSlug) {
    const active = groups.find((group) =>
      group.lessons.some((lesson) => lesson.slug === continueLessonSlug),
    );
    if (active) return [active.module];
  }
  return groups[0] ? [groups[0].module] : [];
}

/** Ringkasan modul untuk hero / dashboard (jumlah lesson per modul). */
export function summarizeN5Modules(): Array<{
  module: string;
  title: string;
  lessonCount: number;
}> {
  const grouped = groupLessonsByModule(N5_ALL_LESSONS);
  return grouped.map((group) => ({
    module: group.module,
    title: N5_MODULE_META[group.module as N5Module]?.title ?? group.title,
    lessonCount: group.lessons.length,
  }));
}

export type { N5LessonDef, N5Module };
