import type { ImportSyllabusTreeResult } from '@/prisma/lib/import-syllabus-tree';

export type CourseImportTemplateInfo = {
    key: string;
    version: string;
    detectedBy: string;
};

export type CourseImportRowError = {
    row: number;
    message: string;
    sheet?: string;
    code?: string;
};

export type CourseImportModulePreview = {
    moduleTitle: string;
    moduleExternalId: string;
    order: number;
    lessons: Array<{
        title: string;
        lessonType: string;
        lessonExternalId: string;
    }>;
};

export type CourseImportPreview = {
    ok: boolean;
    rowCount: number;
    courseCount: number;
    moduleCount: number;
    lessonCount: number;
    kosakataCount: number;
    kanjiCount: number;
    tataBahasaCount: number;
    questionCount: number;
    courses: Array<{
        slug: string;
        title: string;
        level: string;
        isPublished: boolean;
        moduleCount: number;
        lessonCount: number;
    }>;
    errors: CourseImportRowError[];
    warnings: string[];
    structuredWarnings?: CourseImportRowError[];
    modulePreview?: CourseImportModulePreview[];
    template?: CourseImportTemplateInfo;
};

export type CourseImportResult = {
    ok: boolean;
    preview: CourseImportPreview;
    imported: ImportSyllabusTreeResult[];
    errors?: CourseImportRowError[];
    /** Pesan ringkas untuk admin UI saat impor gagal di persistence. */
    message?: string;
};

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 8000;
