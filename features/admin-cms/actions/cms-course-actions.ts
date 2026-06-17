'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { courseFormSchema } from '@/features/admin-cms/lib/validations';

export type CmsActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseCourseForm(formData: FormData) {
  return courseFormSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
    level: formData.get('level'),
    isPublished: formData.get('isPublished') === 'on',
  });
}

export async function createCourseAction(formData: FormData): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = parseCourseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  try {
    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        level: data.level,
        isPublished: data.isPublished,
      },
    });
    revalidateStudentLearningSurfaces();
    revalidatePath(ADMIN_ROUTES.kursus);
    redirect(ADMIN_ROUTES.kursusModules(course.id));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'Slug kursus sudah dipakai.' };
    }
    throw error;
  }
}

export async function updateCourseAction(
  courseId: string,
  formData: FormData,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = parseCourseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  try {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        level: data.level,
        isPublished: data.isPublished,
      },
    });
    revalidateStudentLearningSurfaces();
    revalidatePath(ADMIN_ROUTES.kursus);
    revalidatePath(ADMIN_ROUTES.kursusModules(courseId));
    redirect(ADMIN_ROUTES.kursusModules(courseId));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'Slug kursus sudah dipakai.' };
    }
    throw error;
  }
}

export async function deleteCourseAction(courseId: string): Promise<CmsActionResult> {
  await requireAdminAction();
  await prisma.course.delete({ where: { id: courseId } });
  revalidateStudentLearningSurfaces();
  revalidatePath(ADMIN_ROUTES.kursus);
  return { ok: true };
}

export async function toggleCoursePublishedAction(
  courseId: string,
  isPublished: boolean,
): Promise<CmsActionResult> {
  await requireAdminAction();
  await prisma.course.update({
    where: { id: courseId },
    data: { isPublished },
  });
  revalidateStudentLearningSurfaces();
  revalidatePath(ADMIN_ROUTES.kursus);
  return { ok: true };
}
