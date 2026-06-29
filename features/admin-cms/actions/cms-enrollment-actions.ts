'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
import { userAnchorCreateData } from '@/lib/auth/sync-user-anchor';
import {
  notifyCourseGranted,
  notifyEnrollmentApproved,
  notifyEnrollmentRejected,
} from '@/lib/lms/notifications';
import { uuidSchema } from '@/lib/validations/shared';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';

const grantEnrollmentSchema = z.object({
  userId: z.string().trim().min(1, 'User ID wajib diisi'),
  courseId: uuidSchema,
});

export async function approveEnrollmentAction(enrollmentId: string): Promise<CmsActionResult> {
  await requireAdminAction();

  const parsedId = uuidSchema.safeParse(enrollmentId);
  if (!parsedId.success) {
    return { ok: false, message: 'Enrollment tidak valid.' };
  }

  const enrollment = await prisma.enrollment.update({
    where: { id: parsedId.data },
    data: { status: 'ACTIVE' },
    select: {
      id: true,
      userId: true,
      course: { select: { title: true, slug: true } },
    },
  });

  await notifyEnrollmentApproved({
    enrollmentId: enrollment.id,
    studentUserId: enrollment.userId,
    courseTitle: enrollment.course?.title ?? 'Kursus',
    courseSlug: enrollment.course?.slug ?? '',
  });

  revalidateStudentLearningSurfaces({ userId: enrollment.userId });
  revalidatePath(ADMIN_ROUTES.pembayaran);
  revalidatePath(ADMIN_ROUTES.users);
  revalidatePath(ADMIN_ROUTES.userDetail(enrollment.userId));
  return { ok: true };
}

export async function rejectEnrollmentAction(enrollmentId: string): Promise<CmsActionResult> {
  await requireAdminAction();

  const parsedId = uuidSchema.safeParse(enrollmentId);
  if (!parsedId.success) {
    return { ok: false, message: 'Enrollment tidak valid.' };
  }

  const enrollment = await prisma.enrollment.delete({
    where: { id: parsedId.data },
    select: {
      id: true,
      userId: true,
      course: { select: { title: true } },
    },
  });

  await notifyEnrollmentRejected({
    enrollmentId: enrollment.id,
    studentUserId: enrollment.userId,
    courseTitle: enrollment.course?.title ?? 'Kursus',
  });

  revalidateStudentLearningSurfaces({ userId: enrollment.userId });
  revalidatePath(ADMIN_ROUTES.pembayaran);
  revalidatePath(ADMIN_ROUTES.users);
  revalidatePath(ADMIN_ROUTES.userDetail(enrollment.userId));
  return { ok: true };
}

export async function grantEnrollmentAction(formData: FormData): Promise<CmsActionResult> {
  await requireAdminAction();

  const parsed = grantEnrollmentSchema.safeParse({
    userId: formData.get('userId'),
    courseId: formData.get('courseId'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { userId, courseId } = parsed.data;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true, slug: true },
  });
  if (!course) return { ok: false, message: 'Kursus tidak ditemukan.' };

  await prisma.user.upsert({
    where: { id: userId },
    create: userAnchorCreateData(userId),
    update: {},
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, type: 'COURSE', status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  });

  await notifyCourseGranted({
    studentUserId: userId,
    courseTitle: course.title,
    courseSlug: course.slug,
    courseId,
  });

  revalidateStudentLearningSurfaces({ userId });
  revalidatePath(ADMIN_ROUTES.pembayaran);
  revalidatePath(ADMIN_ROUTES.users);
  revalidatePath(ADMIN_ROUTES.userDetail(userId));
  return { ok: true };
}
