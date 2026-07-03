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
  notifyLiveClassApproval,
} from '@/lib/lms/notifications';
import { uuidSchema } from '@/lib/validations/shared';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';

const grantEnrollmentSchema = z.object({
  userId: z.string().trim().min(1, 'User ID wajib diisi'),
  type: z.enum(['COURSE', 'LIVE_CLASS', 'TRYOUT']),
  productId: uuidSchema,
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
      type: true,
      course: { select: { title: true, slug: true } },
      liveClass: { select: { title: true } },
      tryoutSession: { select: { title: true } },
    },
  });

  if (enrollment.type === 'COURSE') {
    await notifyEnrollmentApproved({
      enrollmentId: enrollment.id,
      studentUserId: enrollment.userId,
      courseTitle: enrollment.course?.title ?? 'Kursus',
      courseSlug: enrollment.course?.slug ?? '',
    });
  } else if (enrollment.type === 'LIVE_CLASS') {
    await notifyLiveClassApproval({
      studentUserId: enrollment.userId,
      liveClassTitle: enrollment.liveClass?.title ?? 'Live Class',
    });
  } else if (enrollment.type === 'TRYOUT') {
    await notifyEnrollmentApproved({
      enrollmentId: enrollment.id,
      studentUserId: enrollment.userId,
      courseTitle: enrollment.tryoutSession?.title ?? 'Tryout',
      courseSlug: '',
    });
  }

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
      type: true,
      course: { select: { title: true } },
      liveClass: { select: { title: true } },
      tryoutSession: { select: { title: true } },
    },
  });

  const title =
    enrollment.type === 'COURSE'
      ? (enrollment.course?.title ?? 'Kursus')
      : enrollment.type === 'LIVE_CLASS'
      ? (enrollment.liveClass?.title ?? 'Live Class')
      : (enrollment.tryoutSession?.title ?? 'Tryout');

  await notifyEnrollmentRejected({
    enrollmentId: enrollment.id,
    studentUserId: enrollment.userId,
    courseTitle: title,
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
    type: formData.get('type'),
    productId: formData.get('productId'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { userId, type, productId } = parsed.data;

  await prisma.user.upsert({
    where: { id: userId },
    create: userAnchorCreateData(userId),
    update: {},
  });

  if (type === 'COURSE') {
    const course = await prisma.course.findUnique({
      where: { id: productId },
      select: { title: true, slug: true },
    });
    if (!course) return { ok: false, message: 'Kursus tidak ditemukan.' };

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: productId } },
      create: { userId, courseId: productId, type: 'COURSE', status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    });

    await notifyCourseGranted({
      studentUserId: userId,
      courseTitle: course.title,
      courseSlug: course.slug,
      courseId: productId,
    });
  } else if (type === 'LIVE_CLASS') {
    const liveClass = await prisma.liveClass.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!liveClass) return { ok: false, message: 'Live class tidak ditemukan.' };

    await prisma.enrollment.upsert({
      where: { userId_liveClassId: { userId, liveClassId: productId } },
      create: { userId, liveClassId: productId, type: 'LIVE_CLASS', status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    });
  } else {
    const tryout = await prisma.tryoutSession.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!tryout) return { ok: false, message: 'Sesi tryout tidak ditemukan.' };

    await prisma.enrollment.upsert({
      where: { userId_tryoutSessionId: { userId, tryoutSessionId: productId } },
      create: { userId, tryoutSessionId: productId, type: 'TRYOUT', status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    });
  }

  revalidateStudentLearningSurfaces({ userId });
  revalidatePath(ADMIN_ROUTES.pembayaran);
  revalidatePath(ADMIN_ROUTES.users);
  revalidatePath(ADMIN_ROUTES.userDetail(userId));
  return { ok: true };
}
