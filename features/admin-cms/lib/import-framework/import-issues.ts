export type CourseImportIssueSeverity = 'error' | 'warning';

export type CourseImportIssue = {
  severity: CourseImportIssueSeverity;
  code: string;
  message: string;
  sheet?: string;
  row?: number;
  field?: string;
};

export function isBlockingImportIssue(issue: CourseImportIssue): boolean {
  return issue.severity === 'error';
}
