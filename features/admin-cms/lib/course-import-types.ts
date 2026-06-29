import type { ImportSyllabusTreeResult } from '@/prisma/lib/import-syllabus-tree';

export type CourseImportRowError = {
    row: number;
    message: string;
    sheet?: string;
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
};

export type CourseImportResult = {
    ok: boolean;
    preview: CourseImportPreview;
    imported: ImportSyllabusTreeResult[];
    errors?: CourseImportRowError[];
};

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;
