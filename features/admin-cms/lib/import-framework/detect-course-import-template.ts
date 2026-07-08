import type ExcelJS from 'exceljs';
import type { SupportedCourseImportTemplate } from '@/features/admin-cms/lib/import-framework/import-template-types';
import {
  isOfficialCourseV1Metadata,
  readOfficialCourseV1Metadata,
} from '@/features/admin-cms/lib/import-framework/official-course-v1-metadata';
import { detectSenseiLevel } from '@/prisma/lib/sensei-import-manifests';

export function detectCourseImportTemplate(
  workbook: ExcelJS.Workbook,
): SupportedCourseImportTemplate | null {
  const metadata = readOfficialCourseV1Metadata(workbook);
  if (metadata && isOfficialCourseV1Metadata(metadata)) {
    return {
      key: 'official-course',
      version: 'v1',
      detectedBy: 'metadata',
    };
  }

  if (detectSenseiLevel(workbook)) {
    return {
      key: 'sensei-jlpt',
      version: 'v1',
      detectedBy: 'sheet-pattern',
    };
  }

  return null;
}
