/** Utilitas hirarki Course → Module → Lesson dari data Prisma / API. */

export type LessonRow = {
  id: string;
  slug: string;
  title: string;
  order: number;
  content?: string | null;
  videoUrl?: string | null;
  hasQuiz?: boolean;
};

export type ModuleRow = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: LessonRow[];
};

export function flattenLessonsFromModules(modules: ModuleRow[]): LessonRow[] {
  return [...modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((mod) => [...mod.lessons].sort((a, b) => a.order - b.order));
}

export function countLessonsInModules(modules: ModuleRow[]): number {
  return modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
}

export type SyllabusModuleGroup<T> = {
  module: string;
  title: string;
  subtitle: string;
  lessons: T[];
};

/** Kelompokkan lesson per modul DB — pengganti inferensi slug. */
export function groupLessonsByDbModules<T extends { order: number }>(
  modules: Array<{
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    order: number;
    lessons: T[];
  }>,
): SyllabusModuleGroup<T>[] {
  return [...modules]
    .sort((a, b) => a.order - b.order)
    .map((mod) => ({
      module: mod.slug,
      title: mod.title,
      subtitle: mod.description ?? `${mod.lessons.length} pelajaran`,
      lessons: [...mod.lessons].sort((a, b) => a.order - b.order),
    }));
}

export function getDefaultExpandedModuleSlugs(
  groups: SyllabusModuleGroup<{ slug: string }>[],
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

type PrismaLessonWithCount = {
  id: string;
  slug: string;
  title: string;
  order: number;
  content?: string | null;
  videoUrl?: string | null;
  _count?: { questions: number };
};

type PrismaModuleWithLessons = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: PrismaLessonWithCount[];
};

/** Map hasil query Prisma ke bentuk tree untuk UI / cache. */
export function mapCourseModulesFromPrisma(modules: PrismaModuleWithLessons[]): ModuleRow[] {
  return modules.map((mod) => ({
    id: mod.id,
    slug: mod.slug,
    title: mod.title,
    description: mod.description ?? null,
    order: mod.order,
    lessons: mod.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      order: lesson.order,
      content: lesson.content ?? null,
      videoUrl: lesson.videoUrl ?? null,
      hasQuiz: (lesson._count?.questions ?? 0) > 0,
    })),
  }));
}

export const COURSE_TREE_INCLUDE = {
  modules: {
    orderBy: { order: 'asc' as const },
    include: {
      lessons: {
        orderBy: { order: 'asc' as const },
        include: { _count: { select: { questions: true } } },
      },
    },
  },
} as const;
