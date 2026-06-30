'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import {
  ensureUniqueCourseSlug,
  resolveSlugInput,
} from '@/lib/lms/slug';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import {
  courseCreateFormSchema,
  courseUpdateFormSchema,
} from '@/features/admin-cms/lib/validations';

export type CmsActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Textarea satu-outcome-per-baris → array bersih (tanpa baris kosong). */
function parseOutcomesField(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string') return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function parseCourseCreateForm(formData: FormData) {
  return courseCreateFormSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug') ?? '',
    description: formData.get('description') ?? '',
    outcomes: parseOutcomesField(formData.get('outcomes')),
    level: formData.get('level'),
    priceIdr: formData.get('priceIdr') ?? '0',
    isPublished: formData.get('isPublished') === 'on',
  });
}

function parseCourseUpdateForm(formData: FormData) {
  return courseUpdateFormSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
    outcomes: parseOutcomesField(formData.get('outcomes')),
    level: formData.get('level'),
    priceIdr: formData.get('priceIdr') ?? '0',
    isPublished: formData.get('isPublished') === 'on',
  });
}

export async function createCourseAction(formData: FormData): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = parseCourseCreateForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const base = resolveSlugInput(data.slug, data.title, 'kursus');
  const slug = await ensureUniqueCourseSlug(prisma, base);

  try {
    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description || null,
        outcomes: data.outcomes,
        level: data.level,
        priceIdr: data.priceIdr,
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
  const parsed = parseCourseUpdateForm(formData);
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
        outcomes: data.outcomes,
        level: data.level,
        priceIdr: data.priceIdr,
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
