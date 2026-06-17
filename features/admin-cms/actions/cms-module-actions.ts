'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { moduleFormSchema } from '@/features/admin-cms/lib/validations';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';

function parseModuleForm(formData: FormData) {
  return moduleFormSchema.safeParse({
    courseId: formData.get('courseId'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
    order: formData.get('order'),
  });
}

export async function createModuleAction(formData: FormData): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = parseModuleForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  try {
    const moduleRow = await prisma.module.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        order: data.order,
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
  const parsed = parseModuleForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  try {
    await prisma.module.update({
      where: { id: moduleId },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        order: data.order,
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
