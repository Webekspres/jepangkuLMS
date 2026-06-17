'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';
import { prisma } from '@/lib/prisma';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { lessonFormSchema } from '@/features/admin-cms/lib/validations';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';
import { updateTag } from 'next/cache';

function parseLessonForm(formData: FormData) {
  return lessonFormSchema.safeParse({
    moduleId: formData.get('moduleId'),
    courseId: formData.get('courseId'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    order: formData.get('order'),
    content: formData.get('content') ?? '',
    videoUrl: formData.get('videoUrl') ?? '',
  });
}

function revalidateLessonPaths(courseId: string, moduleId: string, lessonId?: string) {
  revalidatePath(ADMIN_ROUTES.kursusLessons(courseId, moduleId));
  revalidatePath(ADMIN_ROUTES.kursusModules(courseId));
  revalidatePath(ADMIN_ROUTES.kursus);
  revalidatePath('/kursus');
  revalidatePath('/dashboard/kursus');
  updateTag(LEARNING_CACHE_TAGS.coursesCatalog);
  if (lessonId) {
    updateTag(LEARNING_CACHE_TAGS.lessonMaterials(lessonId));
  }
}

export async function createLessonAction(formData: FormData): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = parseLessonForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  try {
    await prisma.lesson.create({
      data: {
        moduleId: data.moduleId,
        title: data.title,
        slug: data.slug,
        order: data.order,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
      },
    });
    revalidateLessonPaths(data.courseId, data.moduleId);
    redirect(ADMIN_ROUTES.kursusLessons(data.courseId, data.moduleId));
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
  const parsed = parseLessonForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  try {
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        moduleId: data.moduleId,
        title: data.title,
        slug: data.slug,
        order: data.order,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
      },
    });
    revalidateLessonPaths(data.courseId, data.moduleId, lessonId);
    redirect(ADMIN_ROUTES.kursusLessons(data.courseId, data.moduleId));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'Slug pelajaran sudah dipakai.' };
    }
    throw error;
  }
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
