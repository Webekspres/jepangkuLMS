'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { ensureUniqueLessonSlug, resolveSlugInput } from '@/lib/lms/slug';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { sanitizeCurriculumTitle } from '@/features/admin-cms/lib/curriculum-display';
import {
  lessonCreateFormSchema,
  lessonUpdateFormSchema,
} from '@/features/admin-cms/lib/validations';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';
import { getNextLessonOrder } from '@/features/admin-cms/lib/load-admin-cms-data';

function parseLessonCreateForm(formData: FormData) {
  const orderRaw = formData.get('order');
  return lessonCreateFormSchema.safeParse({
    moduleId: formData.get('moduleId'),
    courseId: formData.get('courseId'),
    title: formData.get('title'),
    slug: formData.get('slug') ?? '',
    order: orderRaw === null || orderRaw === '' ? undefined : orderRaw,
    content: formData.get('content') ?? '',
    videoUrl: formData.get('videoUrl') ?? '',
  });
}

function parseLessonUpdateForm(formData: FormData) {
  return lessonUpdateFormSchema.safeParse({
    moduleId: formData.get('moduleId'),
    courseId: formData.get('courseId'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    content: formData.get('content') ?? '',
    videoUrl: formData.get('videoUrl') ?? '',
  });
}

function revalidateLessonPaths(courseId: string, moduleId: string, lessonId?: string) {
  revalidateStudentLearningSurfaces({ lessonId });
  revalidatePath(ADMIN_ROUTES.kursusLessons(courseId, moduleId));
  revalidatePath(ADMIN_ROUTES.kursusModules(courseId));
  revalidatePath(ADMIN_ROUTES.kursus);
}

export async function createLessonAction(formData: FormData): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = parseLessonCreateForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const title = sanitizeCurriculumTitle(data.title);
  const order = data.order ?? (await getNextLessonOrder(data.moduleId));
  const base = resolveSlugInput(data.slug, title, 'pelajaran', order);
  const slug = await ensureUniqueLessonSlug(prisma, base);

  try {
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: data.moduleId,
        title,
        slug,
        order,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
      },
    });
    revalidateLessonPaths(data.courseId, data.moduleId, lesson.id);
    redirect(
      `${ADMIN_ROUTES.kursusLessonForm(data.courseId, data.moduleId)}?id=${lesson.id}`,
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'Slug pelajaran sudah dipakai.' };
    }
    throw error;
  }
}

export async function updateLessonAction(
  lessonId: string,
  formData: FormData,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = parseLessonUpdateForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const title = sanitizeCurriculumTitle(data.title);
  try {
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        moduleId: data.moduleId,
        title,
        slug: data.slug,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
      },
    });
    revalidateLessonPaths(data.courseId, data.moduleId, lessonId);
    revalidatePath(
      `${ADMIN_ROUTES.kursusLessonForm(data.courseId, data.moduleId)}?id=${lessonId}`,
    );
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'Slug pelajaran sudah dipakai.' };
    }
    throw error;
  }
}

export async function reorderLessonsAction(
  courseId: string,
  moduleId: string,
  orderedIds: string[],
): Promise<CmsActionResult> {
  await requireAdminAction();

  const lessons = await prisma.lesson.findMany({
    where: { moduleId },
    select: { id: true },
    orderBy: { order: 'asc' },
  });

  if (orderedIds.length !== lessons.length) {
    return { ok: false, message: 'Daftar urutan pelajaran tidak lengkap.' };
  }

  const validIds = new Set(lessons.map((row) => row.id));
  if (!orderedIds.every((id) => validIds.has(id))) {
    return { ok: false, message: 'Pelajaran tidak valid untuk modul ini.' };
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.lesson.update({ where: { id }, data: { order: index + 1 } }),
    ),
  );

  revalidateLessonPaths(courseId, moduleId);
  return { ok: true };
}

export async function deleteLessonAction(
  courseId: string,
  moduleId: string,
  lessonId: string,
): Promise<CmsActionResult> {
  await requireAdminAction();
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidateLessonPaths(courseId, moduleId, lessonId);
  return { ok: true };
}
