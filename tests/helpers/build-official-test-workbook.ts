import ExcelJS from 'exceljs';
import { buildCourseImportTemplateV1Buffer } from '@/features/admin-cms/lib/build-course-import-template-v1';

const LESSON_SHEET = '3. Lesson';

/**
 * Same as the official template but with an extra VIDEO lesson that has no URL row —
 * triggers VIDEO_URL_REQUIRED during normalized validation.
 */
export async function buildInvalidOfficialVideoWorkbookBuffer(): Promise<Buffer> {
  const buffer = await buildCourseImportTemplateV1Buffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const lessonSheet = workbook.getWorksheet(LESSON_SHEET);
  if (!lessonSheet) {
    throw new Error(`Sheet "${LESSON_SHEET}" not found in official template.`);
  }

  const nextRow = lessonSheet.rowCount + 1;
  lessonSheet.getRow(nextRow).values = [
    ,
    'pelajaran-video-invalid',
    'modul-1',
    'Video Tanpa URL',
    2,
    'VIDEO',
  ];

  const out = await workbook.xlsx.writeBuffer();
  return Buffer.from(out);
}
