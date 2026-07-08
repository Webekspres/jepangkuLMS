import type { CourseImportIssue } from '@/features/admin-cms/lib/import-framework/import-issues';

export function formatCourseImportIssue(issue: CourseImportIssue): string {
  const locationParts: string[] = [];
  if (issue.sheet) locationParts.push(`Tab ${issue.sheet}`);
  if (issue.row) locationParts.push(`baris ${issue.row}`);
  const prefix = locationParts.length > 0 ? `${locationParts.join(', ')}: ` : '';
  return `${prefix}${issue.message}`;
}

export function courseImportIssueToRowError(issue: CourseImportIssue): {
  row: number;
  message: string;
  sheet?: string;
  code?: string;
} {
  return {
    row: issue.row ?? 0,
    message: formatCourseImportIssue(issue),
    sheet: issue.sheet,
    code: issue.code,
  };
}
