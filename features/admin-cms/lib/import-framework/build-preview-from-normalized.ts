import type { CourseImportPreview } from '@/features/admin-cms/lib/course-import-types';
import type { NormalizedCourseImport } from '@/features/admin-cms/lib/import-framework/normalized-import-types';

export function buildPreviewFromNormalized(
  normalized: NormalizedCourseImport,
  options?: {
    rowCount?: number;
    warnings?: string[];
    ok?: boolean;
  },
): CourseImportPreview {
  let kosakataCount = 0;
  let kanjiCount = 0;
  let tataBahasaCount = 0;
  let questionCount = 0;

  for (const module of normalized.modules) {
    for (const lesson of module.lessons) {
      if (lesson.content.kind === 'FLASHCARD') {
        kanjiCount += lesson.content.kanjis.length;
        kosakataCount += lesson.content.kosakatas.length;
        tataBahasaCount += lesson.content.tataBahasas.length;
      }
      if (lesson.content.kind === 'QUIZ') {
        questionCount += lesson.content.questions.length;
      }
    }
  }

  const lessonCount = normalized.modules.reduce((sum, module) => sum + module.lessons.length, 0);

  return {
    ok: options?.ok ?? true,
    rowCount: options?.rowCount ?? lessonCount,
    courseCount: 1,
    moduleCount: normalized.modules.length,
    lessonCount,
    kosakataCount,
    kanjiCount,
    tataBahasaCount,
    questionCount,
    courses: [
      {
        slug: normalized.course.slug ?? normalized.course.courseExternalId,
        title: normalized.course.title,
        level: normalized.course.level ?? '',
        isPublished: normalized.course.isPublished ?? false,
        moduleCount: normalized.modules.length,
        lessonCount,
      },
    ],
    errors: [],
    warnings: options?.warnings ?? [],
    template: {
      key: normalized.template.key,
      version: normalized.template.version,
      detectedBy: normalized.template.detectedBy,
    },
  };
}
