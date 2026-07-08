import type { importSenseiCourseXlsx } from '@/features/admin-cms/lib/import-sensei-course-xlsx';

export function createMockSenseiImportPrisma() {
    const createdKanji: Array<Record<string, unknown>> = [];
    const createdQuestions: Array<Record<string, unknown>> = [];
    const courses = new Map<string, { id: string; slug: string }>();
    const categories = new Map<string, string>();
    const moduleIds = new Map<string, string>();
    const lessonIds = new Map<string, string>();
    let categoryCounter = 1;
    let moduleCounter = 1;
    let lessonCounter = 1;

    const tx = {
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
            findFirst: async ({ where }: { where: { OR: Array<{ courseExternalId?: string; slug?: string }> } }) => {
                for (const candidate of where.OR) {
                    if (candidate.courseExternalId && courses.has(candidate.courseExternalId)) {
                        return courses.get(candidate.courseExternalId)!;
                    }
                    if (candidate.slug && courses.has(candidate.slug)) {
                        return courses.get(candidate.slug)!;
                    }
                }
                return null;
            },
            create: async ({ data }: { data: Record<string, unknown> }) => {
                const id = 'course-1';
                const slug = String(data.slug ?? 'course-1');
                const externalId = String(data.courseExternalId ?? slug);
                const row = { id, slug };
                courses.set(externalId, row);
                courses.set(slug, row);
                return row;
            },
            update: async ({ where }: { where: { id: string } }) => ({ id: where.id }),
        },
        module: {
            findMany: async () => [],
            deleteMany: async () => ({ count: 0 }),
            findFirst: async ({ where }: { where: { OR: Array<{ moduleExternalId?: string; slug?: string }> } }) => {
                for (const candidate of where.OR) {
                    const key = candidate.moduleExternalId ?? candidate.slug;
                    if (key && moduleIds.has(key)) {
                        return { id: moduleIds.get(key)! };
                    }
                }
                return null;
            },
            create: async ({ data }: { data: Record<string, unknown> }) => {
                const slug = String(data.slug ?? data.moduleExternalId ?? `module-${moduleCounter}`);
                const id = moduleIds.get(slug) ?? `module-${moduleCounter++}`;
                moduleIds.set(slug, id);
                if (data.moduleExternalId) moduleIds.set(String(data.moduleExternalId), id);
                return { id };
            },
            update: async ({ where }: { where: { id: string } }) => ({ id: where.id }),
        },
        lesson: {
            deleteMany: async () => ({ count: 0 }),
            findFirst: async ({ where }: { where: { slug?: string; lessonExternalId?: string } }) => {
                if (where.slug && lessonIds.has(where.slug)) {
                    return { id: lessonIds.get(where.slug)! };
                }
                if (where.lessonExternalId && lessonIds.has(where.lessonExternalId)) {
                    return { id: lessonIds.get(where.lessonExternalId)! };
                }
                return null;
            },
            create: async ({ data }: { data: Record<string, unknown> }) => {
                const slug = String(data.slug ?? data.lessonExternalId ?? `lesson-${lessonCounter}`);
                const id = lessonIds.get(slug) ?? `lesson-${lessonCounter++}`;
                lessonIds.set(slug, id);
                if (data.lessonExternalId) lessonIds.set(String(data.lessonExternalId), id);
                return { id };
            },
            update: async ({ where }: { where: { id: string } }) => ({ id: where.id }),
        },
    };

    const prisma = {
        ...tx,
        $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => callback(tx),
    } as unknown as Parameters<typeof importSenseiCourseXlsx>[0];

    return { prisma, createdKanji, createdQuestions };
}
