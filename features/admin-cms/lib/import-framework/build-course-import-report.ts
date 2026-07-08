import {
  isBlockingImportIssue,
  type CourseImportIssue,
} from '@/features/admin-cms/lib/import-framework/import-issues';

export type CourseImportReport = {
  ok: boolean;
  errors: CourseImportIssue[];
  warnings: CourseImportIssue[];
};

export function buildCourseImportReport(issues: CourseImportIssue[]): CourseImportReport {
  const errors = issues.filter(isBlockingImportIssue);
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
