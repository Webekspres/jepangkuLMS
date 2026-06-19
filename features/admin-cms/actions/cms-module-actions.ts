'use server';

import { revalidatePath } from 'next/cache';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { sanitizeCurriculumTitle } from '@/features/admin-cms/lib/curriculum-display';
import {
  moduleCreateFormSchema,
  moduleUpdateFormSchema,
} from '@/features/admin-cms/lib/validations';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';
import {
  ensureUniqueModuleSlug,
  resolveSlugInput,
} from '@/lib/lms/slug';
import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { getNextModuleOrder } from '@/features/admin-cms/lib/load-admin-cms-data';

function parseModuleCreateForm(formData: FormData) {
  const orderRaw = formData.get('order');
  return moduleCreateFormSchema.safeParse({
    courseId: formData.get('courseId'),
    title: formData.get('title'),
    slug: formData.get('slug') ?? '',
    description: formData.get('description') ?? '',
    order: orderRaw === null || orderRaw === '' ? undefined : orderRaw,
  });
}

function parseModuleUpdateForm(formData: FormData) {
  return moduleUpdateFormSchema.safeParse({
    courseId: formData.get('courseId'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
  });
}

export async function createModuleAction(formData: FormData): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = parseModuleCreateForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const title = sanitizeCurriculumTitle(data.title);
  const order = data.order ?? (await getNextModuleOrder(data.courseId));
  const base = resolveSlugInput(data.slug, title, 'modul', order);
  const slug = await ensureUniqueModuleSlug(prisma, data.courseId, base);

  try {
    const moduleRow = await prisma.module.create({
      data: {
        courseId: data.courseId,
        title,
        slug,
        description: data.description || null,
        order,
      },
    });
    revalidateStudentLearningSurfaces();
    revalidatePath(ADMIN_ROUTES.kursusModules(data.courseId));
    redirect(ADMIN_ROUTES.kursusLessons(data.courseId, moduleRow.id));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'Slug atau urutan modul bentrok di kursus ini.' };
    }
    throw error;
  }
}

export async function updateModuleAction(
  moduleId: string,
  formData: FormData,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = parseModuleUpdateForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const title = sanitizeCurriculumTitle(data.title);
  try {
    await prisma.module.update({
      where: { id: moduleId },
      data: {
        title,
        slug: data.slug,
        description: data.description || null,
      },
    });
    revalidateStudentLearningSurfaces();
    revalidatePath(ADMIN_ROUTES.kursusModules(data.courseId));
    revalidatePath(ADMIN_ROUTES.kursusLessons(data.courseId, moduleId));
    redirect(ADMIN_ROUTES.kursusLessons(data.courseId, moduleId));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'Slug atau urutan modul bentrok di kursus ini.' };
    }
    throw error;
  }
}

export async function reorderModulesAction(
  courseId: string,
  orderedIds: string[],
): Promise<CmsActionResult> {
  await requireAdminAction();

  const modules = await prisma.module.findMany({
    where: { courseId },
    select: { id: true },
    orderBy: { order: 'asc' },
  });

  if (orderedIds.length !== modules.length) {
    return { ok: false, message: 'Daftar urutan modul tidak lengkap.' };
  }

  const validIds = new Set(modules.map((row) => row.id));
  if (!orderedIds.every((id) => validIds.has(id))) {
    return { ok: false, message: 'Modul tidak valid untuk kursus ini.' };
  }

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await tx.module.update({
        where: { id: orderedIds[index] },
        data: { order: 10_000 + index },
      });
    }
    for (let index = 0; index < orderedIds.length; index += 1) {
      await tx.module.update({
        where: { id: orderedIds[index] },
        data: { order: index + 1 },
      });
    }
  });

  revalidateStudentLearningSurfaces();
  revalidatePath(ADMIN_ROUTES.kursusModules(courseId));
  return { ok: true };
}

export async function deleteModuleAction(
  courseId: string,
  moduleId: string,
): Promise<CmsActionResult> {
  await requireAdminAction();
  await prisma.module.delete({ where: { id: moduleId } });
  revalidateStudentLearningSurfaces();
  revalidatePath(ADMIN_ROUTES.kursusModules(courseId));
  return { ok: true };
}
