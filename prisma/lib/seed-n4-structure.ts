import type { PrismaClient } from '@prisma/client';
import { N4_ALL_LESSONS } from './n4-curriculum';
import { N4_MODULE_DEFINITIONS } from './n4-modules';
import type { N4Module } from './n4-curriculum';

export type N4StructureIds = {
    moduleIds: Record<string, string>;
    lessonIdsBySlug: Record<string, string>;
};

export async function seedN4CourseStructure(
    prisma: PrismaClient,
    courseId: string,
): Promise<N4StructureIds> {
    await prisma.module.deleteMany({
        where: { courseId, slug: 'legacy' },
    });

    const moduleIds: Record<string, string> = {};
    const ORDER_OFFSET = 10_000;

    for (const mod of N4_MODULE_DEFINITIONS) {
        const row = await prisma.module.upsert({
            where: { courseId_slug: { courseId, slug: mod.slug } },
            create: {
                courseId,
                slug: mod.slug,
                title: mod.title,
                order: mod.order + ORDER_OFFSET,
                description: mod.description,
            },
            update: {
                title: mod.title,
                description: mod.description,
                order: mod.order + ORDER_OFFSET,
            },
        });
        moduleIds[mod.slug] = row.id;
    }

    for (const mod of N4_MODULE_DEFINITIONS) {
        await prisma.module.update({
            where: { courseId_slug: { courseId, slug: mod.slug } },
            data: { order: mod.order },
        });
    }

    const lessonIdsBySlug: Record<string, string> = {};
    for (const lesson of N4_ALL_LESSONS) {
        const moduleId = moduleIds[lesson.module as N4Module];
        if (!moduleId) {
            throw new Error(`Modul tidak ditemukan untuk lesson ${lesson.slug} (${lesson.module})`);
        }

        const row = await prisma.lesson.upsert({
            where: { slug: lesson.slug },
            create: {
                slug: lesson.slug,
                title: lesson.title,
                order: lesson.order,
                content: lesson.content,
                moduleId,
            },
            update: {
                title: lesson.title,
                order: lesson.order,
                content: lesson.content,
                moduleId,
            },
        });
        lessonIdsBySlug[lesson.slug] = row.id;
    }

    return { moduleIds, lessonIdsBySlug };
}
