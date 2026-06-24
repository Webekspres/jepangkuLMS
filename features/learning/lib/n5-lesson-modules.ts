import type { CourseSyllabusModule } from '@/features/learning/components/course-detail-data';
import {
  getDefaultExpandedModuleSlugs,
  groupLessonsByDbModules,
  type SyllabusModuleGroup,
} from '@/features/learning/lib/course-tree';
import { N5_MODULE_DEFINITIONS } from '@/prisma/lib/n5-modules';
import {
  N5_ALL_LESSONS,
  type N5LessonDef,
  type N5Module,
} from '@/prisma/lib/n5-curriculum';

export const N5_MODULE_META: Record<
  N5Module,
  { title: string; subtitle: string; order: number }
> = Object.fromEntries(
  N5_MODULE_DEFINITIONS.map((mod) => [
    mod.slug,
    { title: mod.title, subtitle: mod.description, order: mod.order },
  ]),
) as Record<N5Module, { title: string; subtitle: string; order: number }>;

const N5_MODULE_ORDER: N5Module[] = N5_MODULE_DEFINITIONS.sort(
  (a, b) => a.order - b.order,
).map((m) => m.slug);

const N5_LESSON_MODULE_BY_SLUG = new Map(
  N5_ALL_LESSONS.map((lesson) => [lesson.slug, lesson.module]),
);

/** Fallback: tentukan modul dari slug lesson jika kursus belum punya modul DB. */
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

export type GroupedLesson<T> = SyllabusModuleGroup<T>;

/** Fallback grouping by slug heuristics — gunakan groupLessonsByDbModules jika modul ada di DB. */
export function groupLessonsByModule<T extends { slug: string; order: number }>(
  lessons: T[],
): GroupedLesson<T>[] {
  const buckets = new Map<N5Module, T[]>();

  for (const lesson of [...lessons].sort((a, b) => a.order - b.order)) {
    const lessonModule = inferLessonModule(lesson.slug);
    const list = buckets.get(lessonModule) ?? [];
    list.push(lesson);
    buckets.set(lessonModule, list);
  }

  return N5_MODULE_ORDER.filter((mod) => buckets.has(mod)).map((mod) => ({
    module: mod,
    title: N5_MODULE_META[mod].title,
    subtitle: N5_MODULE_META[mod].subtitle,
    lessons: buckets.get(mod)!,
  }));
}

export function groupSyllabusWithDbModules<T extends { slug: string; order: number }>(
  modules: Array<{
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    order: number;
    lessons: Array<{ slug: string; order: number }>;
  }>,
  syllabusItems: T[],
): GroupedLesson<T>[] {
  const bySlug = new Map(syllabusItems.map((item) => [item.slug, item]));

  return groupLessonsByDbModules(
    modules.map((mod) => ({
      ...mod,
      lessons: mod.lessons
        .map((lesson) => bySlug.get(lesson.slug))
        .filter((item): item is T => item != null),
    })),
  );
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
  const lessonModule = inferLessonModule(slug);
  if (lessonModule === 'tryout') return '60 menit';
  if (lessonModule === 'kuis') return '30 menit';
  if (lessonModule === 'aksara') return '15 menit';
  return '20 menit';
}

export function getDefaultExpandedModuleIds(
  groups: GroupedLesson<{ slug: string }>[],
  continueLessonSlug?: string | null,
): string[] {
  return getDefaultExpandedModuleSlugs(groups, continueLessonSlug);
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
