import type ExcelJS from 'exceljs';

export const OFFICIAL_COURSE_V1_METADATA_SHEET = '_metadata';

export const OFFICIAL_COURSE_V1_TEMPLATE_KEY = 'official-course';
export const OFFICIAL_COURSE_V1_TEMPLATE_VERSION = 'v1';

export type OfficialCourseV1Metadata = {
  templateKey: string;
  templateVersion: string;
  authoredFor?: string;
};

export function readOfficialCourseV1Metadata(
  workbook: ExcelJS.Workbook,
): OfficialCourseV1Metadata | null {
  const sheet = workbook.getWorksheet(OFFICIAL_COURSE_V1_METADATA_SHEET);
  if (!sheet) return null;

  const entries = new Map<string, string>();
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const key = String(row.getCell(1).text ?? '').trim();
    const value = String(row.getCell(2).text ?? '').trim();
    if (key) entries.set(key, value);
  });

  if (entries.size === 0) return null;

  return {
    templateKey: entries.get('templateKey') ?? '',
    templateVersion: entries.get('templateVersion') ?? '',
    authoredFor: entries.get('authoredFor'),
  };
}

export function isOfficialCourseV1Metadata(
  metadata: OfficialCourseV1Metadata,
): metadata is OfficialCourseV1Metadata & {
  templateKey: typeof OFFICIAL_COURSE_V1_TEMPLATE_KEY;
  templateVersion: typeof OFFICIAL_COURSE_V1_TEMPLATE_VERSION;
} {
  return (
    metadata.templateKey === OFFICIAL_COURSE_V1_TEMPLATE_KEY &&
    metadata.templateVersion === OFFICIAL_COURSE_V1_TEMPLATE_VERSION
  );
}
