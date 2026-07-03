import type { importSenseiCourseXlsx } from '@/features/admin-cms/lib/import-sensei-course-xlsx';

export function createMockSenseiImportPrisma() {
    const createdKanji: Array<Record<string, unknown>> = [];
    const createdQuestions: Array<Record<string, unknown>> = [];
    const categories = new Map<string, string>();
    const moduleIds = new Map<string, string>();
    const lessonIds = new Map<string, string>();
    let categoryCounter = 1;
    let moduleCounter = 1;
    let lessonCounter = 1;

    const prisma = {
        questionOption: { deleteMany: async () => ({ count: 0 }) },
        question: {
            deleteMany: async () => ({ count: 0 }),
            create: async ({ data }: { data: Record<string, unknown> }) => {
                createdQuestions.push(data);
                return { id: `question-${createdQuestions.length}` };
            },
        },
        materialKanji: {
            deleteMany: async () => ({ count: 0 }),
            create: async ({ data }: { data: Record<string, unknown> }) => {
                createdKanji.push(data);
                return { id: `kanji-${createdKanji.length}` };
            },
        },
        materialKosakata: {
            deleteMany: async () => ({ count: 0 }),
            create: async () => ({ id: 'kosakata-1' }),
        },
        materialTataBahasa: {
            deleteMany: async () => ({ count: 0 }),
            create: async () => ({ id: 'tatabahasa-1' }),
        },
        category: {
            upsert: async ({ where }: { where: { name_type: { name: string; type: string } } }) => {
                const key = `${where.name_type.type}:${where.name_type.name}`;
                const id = categories.get(key) ?? `cat-${categoryCounter++}`;
                categories.set(key, id);
                return { id };
            },
        },
        course: {
            upsert: async () => ({ id: 'course-1' }),
        },
        module: {
            deleteMany: async () => ({ count: 0 }),
            updateMany: async () => ({ count: 0 }),
            upsert: async ({ where }: { where: { courseId_slug: { slug: string } } }) => {
                const slug = where.courseId_slug.slug;
                const id = moduleIds.get(slug) ?? `module-${moduleCounter++}`;
                moduleIds.set(slug, id);
                return { id };
            },
            update: async () => ({ id: 'module-updated' }),
        },
        lesson: {
            upsert: async ({ where }: { where: { slug: string } }) => {
                const slug = where.slug;
                const id = lessonIds.get(slug) ?? `lesson-${lessonCounter++}`;
                lessonIds.set(slug, id);
                return { id };
            },
        },
    } as unknown as Parameters<typeof importSenseiCourseXlsx>[0];

    return { prisma, createdKanji, createdQuestions };
}
