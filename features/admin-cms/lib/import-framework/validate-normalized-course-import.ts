import type { CourseImportIssue } from '@/features/admin-cms/lib/import-framework/import-issues';
import type {
  NormalizedCourseImport,
  NormalizedLesson,
} from '@/features/admin-cms/lib/import-framework/normalized-import-types';

function validateLessonContent(lesson: NormalizedLesson): CourseImportIssue[] {
  const issues: CourseImportIssue[] = [];

  if (lesson.lessonType !== lesson.content.kind) {
    issues.push({
      severity: 'error',
      code: 'LESSON_TYPE_CONTENT_MISMATCH',
      message: `Lesson "${lesson.title}" has lessonType "${lesson.lessonType}" but content kind "${lesson.content.kind}".`,
      field: 'lessonType',
    });
  }

  if (lesson.content.kind === 'VIDEO' && !lesson.content.videoUrl.trim()) {
    issues.push({
      severity: 'error',
      code: 'VIDEO_URL_REQUIRED',
      message: `Lesson "${lesson.title}" requires a video URL.`,
      field: 'videoUrl',
    });
  }

  if (lesson.content.kind === 'TEXT' && !lesson.content.textContent.trim()) {
    issues.push({
      severity: 'error',
      code: 'TEXT_CONTENT_REQUIRED',
      message: `Lesson "${lesson.title}" requires text content.`,
      field: 'textContent',
    });
  }

  if (lesson.content.kind === 'QUIZ') {
    lesson.content.questions.forEach((question, questionIndex) => {
      if (question.options.length < 2) {
        issues.push({
          severity: 'error',
          code: 'QUIZ_OPTIONS_MINIMUM',
          message: `Lesson "${lesson.title}" question ${questionIndex + 1} requires at least two answer options.`,
          row: questionIndex + 1,
        });
      }

      const correctCount = question.options.filter((option) => option.isCorrect).length;
      if (correctCount !== 1) {
        issues.push({
          severity: 'error',
          code: 'QUIZ_CORRECT_OPTION_COUNT',
          message: `Lesson "${lesson.title}" question ${questionIndex + 1} must have exactly one correct option.`,
          row: questionIndex + 1,
        });
      }
    });
  }

  return issues;
}

export function validateNormalizedCourseImport(
  input: NormalizedCourseImport,
): CourseImportIssue[] {
  const issues: CourseImportIssue[] = [];

  if (!input.course.courseExternalId.trim()) {
    issues.push({
      severity: 'error',
      code: 'COURSE_EXTERNAL_ID_REQUIRED',
      message: 'Course external ID is required.',
      field: 'courseExternalId',
    });
  }

  if (!input.course.title.trim()) {
    issues.push({
      severity: 'error',
      code: 'COURSE_TITLE_REQUIRED',
      message: 'Course title is required.',
      field: 'title',
    });
  }

  const moduleIds = new Set<string>();
  const lessonIds = new Set<string>();

  input.modules.forEach((module, moduleIndex) => {
    if (!module.moduleExternalId.trim()) {
      issues.push({
        severity: 'error',
        code: 'MODULE_EXTERNAL_ID_REQUIRED',
        message: `Module at position ${moduleIndex + 1} is missing moduleExternalId.`,
        row: moduleIndex + 1,
        field: 'moduleExternalId',
      });
    }

    if (moduleIds.has(module.moduleExternalId)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_MODULE_EXTERNAL_ID',
        message: `Duplicate moduleExternalId "${module.moduleExternalId}".`,
        row: moduleIndex + 1,
        field: 'moduleExternalId',
      });
    }
    moduleIds.add(module.moduleExternalId);

    if (!module.title.trim()) {
      issues.push({
        severity: 'error',
        code: 'MODULE_TITLE_REQUIRED',
        message: `Module "${module.moduleExternalId || moduleIndex + 1}" is missing a title.`,
        row: moduleIndex + 1,
        field: 'title',
      });
    }

    module.lessons.forEach((lesson, lessonIndex) => {
      if (!lesson.lessonExternalId.trim()) {
        issues.push({
          severity: 'error',
          code: 'LESSON_EXTERNAL_ID_REQUIRED',
          message: `Lesson at module "${module.title}" position ${lessonIndex + 1} is missing lessonExternalId.`,
          row: lessonIndex + 1,
          field: 'lessonExternalId',
        });
      }

      if (lessonIds.has(lesson.lessonExternalId)) {
        issues.push({
          severity: 'error',
          code: 'DUPLICATE_LESSON_EXTERNAL_ID',
          message: `Duplicate lessonExternalId "${lesson.lessonExternalId}".`,
          row: lessonIndex + 1,
          field: 'lessonExternalId',
        });
      }
      lessonIds.add(lesson.lessonExternalId);

      if (!lesson.title.trim()) {
        issues.push({
          severity: 'error',
          code: 'LESSON_TITLE_REQUIRED',
          message: `Lesson "${lesson.lessonExternalId || lessonIndex + 1}" is missing a title.`,
          row: lessonIndex + 1,
          field: 'title',
        });
      }

      issues.push(...validateLessonContent(lesson));
    });
  });

  return issues;
}
