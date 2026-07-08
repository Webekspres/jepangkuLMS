import type { CourseImportModulePreview } from '@/features/admin-cms/lib/course-import-types';
import type { NormalizedCourseImport } from '@/features/admin-cms/lib/import-framework/normalized-import-types';

export function buildModulePreviewFromNormalized(
  normalized: NormalizedCourseImport,
): CourseImportModulePreview[] {
  return normalized.modules.map((module) => ({
    moduleTitle: module.title,
    moduleExternalId: module.moduleExternalId,
    order: module.order,
    lessons: module.lessons.map((lesson) => ({
      title: lesson.title,
      lessonType: lesson.lessonType,
      lessonExternalId: lesson.lessonExternalId,
    })),
  }));
}
