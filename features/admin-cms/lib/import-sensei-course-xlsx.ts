import type { PrismaClient } from '@prisma/client';
import type { CourseImportPreview, CourseImportResult } from '@/features/admin-cms/lib/course-import-types';
import {
    importCourseWorkbook,
    previewCourseImport,
} from '@/features/admin-cms/lib/import-framework/import-course-workbook';

/** @deprecated Use previewCourseImport */
export const previewSenseiCourseImport = previewCourseImport;

/** @deprecated Use importCourseWorkbook */
export const importSenseiCourseXlsx = importCourseWorkbook;

export { previewCourseImport, importCourseWorkbook };

export type SenseiImportDeps = {
    prisma: PrismaClient;
    buffer: Buffer;
    preview: CourseImportPreview;
    result: CourseImportResult;
};
