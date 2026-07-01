import type { CourseDetail, CourseSyllabusModule } from '@/features/learning/components/course-detail-data';
import type { CatalogCourse } from '@/features/learning/components/courses-data';
import type { ModuleRow } from '@/features/learning/lib/course-tree';
import { estimateCourseDuration } from '@/features/learning/lib/course-display';

const DEFAULT_INCLUDES = [
  'Akses modul sesuai rilis',
  'Video pelajaran terstruktur',
  'Quiz interaktif per bab',
  'Progress tracking setelah login',
  'Update materi gratis',
] as const;

function buildMarketingSyllabus(modules: ModuleRow[]): CourseSyllabusModule[] {
  return modules.map((mod) => ({
    title: mod.title,
    items: mod.lessons.map((lesson, index) => ({
      title: lesson.title,
      duration: '~20 menit',
      locked: index > 0,
    })),
  }));
}

export function mapDbCourseToDetail(input: {
  catalog: CatalogCourse & { priceIdr: number };
  modules: ModuleRow[];
  outcomes: string[];
}): CourseDetail {
  const { catalog, modules, outcomes } = input;

  return {
    ...catalog,
    fullDesc: catalog.desc,
    whatYouLearn: outcomes.length > 0 ? outcomes : [catalog.desc],
    priceNum: catalog.priceIdr,
    syllabus: buildMarketingSyllabus(modules),
    includes: [...DEFAULT_INCLUDES],
    lessons: catalog.lessons,
    duration: estimateCourseDuration(catalog.lessons),
  };
}
