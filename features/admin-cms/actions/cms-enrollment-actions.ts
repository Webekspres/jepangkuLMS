'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  resolveEnrollmentActorName,
  writeEnrollmentLog,
} from '@/features/admin-cms/lib/enrollment-log';
import { syncLiveClassFilledSlots } from '@/features/admin-cms/lib/enrollment-counts';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import {
  notifyCourseGranted,
  notifyEnrollmentApproved,
  notifyEnrollmentRejected,
  notifyLiveClassApproval,
} from '@/lib/lms/notifications';
import { prisma } from '@/lib/prisma';
import { userAnchorCreateData } from '@/lib/auth/sync-user-anchor';
import { uuidSchema } from '@/lib/validations/shared';

const grantEnrollmentSchema = z.object({
  userId: z.string().trim().min(1, 'User ID wajib diisi'),
  type: z.enum(['COURSE', 'LIVE_CLASS', 'TRYOUT']),
  productId: uuidSchema,
});

const enrollmentLogSelect = {
  id: true,
  userId: true,
  type: true,
  status: true,
  liveClassId: true,
  course: { select: { title: true, slug: true } },
  liveClass: { select: { title: true, senseiName: true } },
  tryoutSession: { select: { title: true, code: true } },
  user: { select: { displayName: true, ssoDisplayName: true } },
} as const;

function productFromEnrollment(row: {
  type: 'COURSE' | 'LIVE_CLASS' | 'TRYOUT';
  course: { title: string; slug: string } | null;
  liveClass: { title: string; senseiName: string } | null;
  tryoutSession: { title: string; code: string } | null;
}): { productTitle: string; productSubtitle: string | null } {
  if (row.type === 'COURSE' && row.course) {
    return { productTitle: row.course.title, productSubtitle: row.course.slug };
  }
  if (row.type === 'LIVE_CLASS' && row.liveClass) {
    return { productTitle: row.liveClass.title, productSubtitle: row.liveClass.senseiName };
  }
  if (row.type === 'TRYOUT' && row.tryoutSession) {
    return {
      productTitle: row.tryoutSession.title,
      productSubtitle: row.tryoutSession.code,
    };
  }
  return { productTitle: 'Program', productSubtitle: null };
}

function studentNameFromEnrollment(row: {
  user: { displayName: string | null; ssoDisplayName: string | null };
}): string {
  return resolvePublicDisplayName({
    displayName: row.user.displayName,
    ssoDisplayName: row.user.ssoDisplayName,
  });
}

export async function approveEnrollmentAction(enrollmentId: string): Promise<CmsActionResult> {
  const adminId = await requireAdminAction();

  const parsedId = uuidSchema.safeParse(enrollmentId);
  if (!parsedId.success) {
    return { ok: false, message: 'Enrollment tidak valid.' };
  }

  const before = await prisma.enrollment.findUnique({
    where: { id: parsedId.data },
    select: enrollmentLogSelect,
  });
  if (!before) return { ok: false, message: 'Enrollment tidak ditemukan.' };

  const enrollment = await prisma.enrollment.update({
    where: { id: parsedId.data },
    data: { status: 'ACTIVE' },
    select: {
      id: true,
      userId: true,
      type: true,
      liveClassId: true,
      course: { select: { title: true, slug: true } },
      liveClass: { select: { title: true } },
      tryoutSession: { select: { title: true } },
    },
  });

  if (enrollment.type === 'LIVE_CLASS' && enrollment.liveClassId) {
    await syncLiveClassFilledSlots(enrollment.liveClassId);
  }

  const product = productFromEnrollment(before);
  const actorName = await resolveEnrollmentActorName(adminId);
  await writeEnrollmentLog({
    enrollmentId: enrollment.id,
    userId: before.userId,
    actorUserId: adminId,
    type: before.type,
    action: 'APPROVED',
    productTitle: product.productTitle,
    productSubtitle: product.productSubtitle,
    studentName: studentNameFromEnrollment(before),
    actorName,
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
  revalidatePath(ADMIN_ROUTES.kursus);
  revalidatePath(ADMIN_ROUTES.liveClass);
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  return { ok: true };
}

export async function rejectEnrollmentAction(enrollmentId: string): Promise<CmsActionResult> {
  const adminId = await requireAdminAction();

  const parsedId = uuidSchema.safeParse(enrollmentId);
  if (!parsedId.success) {
    return { ok: false, message: 'Enrollment tidak valid.' };
  }

  const before = await prisma.enrollment.findUnique({
    where: { id: parsedId.data },
    select: enrollmentLogSelect,
  });
  if (!before) return { ok: false, message: 'Enrollment tidak ditemukan.' };

  const enrollment = await prisma.enrollment.delete({
    where: { id: parsedId.data },
    select: {
      id: true,
      userId: true,
      type: true,
      liveClassId: true,
      course: { select: { title: true } },
      liveClass: { select: { title: true } },
      tryoutSession: { select: { title: true } },
    },
  });

  if (enrollment.type === 'LIVE_CLASS' && enrollment.liveClassId) {
    await syncLiveClassFilledSlots(enrollment.liveClassId);
  }

  const product = productFromEnrollment(before);
  const actorName = await resolveEnrollmentActorName(adminId);
  await writeEnrollmentLog({
    enrollmentId: null,
    userId: before.userId,
    actorUserId: adminId,
    type: before.type,
    action: before.status === 'ACTIVE' ? 'REVOKED' : 'REJECTED',
    productTitle: product.productTitle,
    productSubtitle: product.productSubtitle,
    studentName: studentNameFromEnrollment(before),
    actorName,
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
  revalidatePath(ADMIN_ROUTES.kursus);
  revalidatePath(ADMIN_ROUTES.liveClass);
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  return { ok: true };
}

export async function grantEnrollmentAction(formData: FormData): Promise<CmsActionResult> {
  const adminId = await requireAdminAction();

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

  let enrollmentId: string | undefined;
  let productTitle = 'Program';
  let productSubtitle: string | null = null;

  if (type === 'COURSE') {
    const course = await prisma.course.findUnique({
      where: { id: productId },
      select: { title: true, slug: true },
    });
    if (!course) return { ok: false, message: 'Kursus tidak ditemukan.' };

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: productId } },
      create: { userId, courseId: productId, type: 'COURSE', status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
      select: { id: true },
    });
    enrollmentId = enrollment.id;
    productTitle = course.title;
    productSubtitle = course.slug;

    await notifyCourseGranted({
      studentUserId: userId,
      courseTitle: course.title,
      courseSlug: course.slug,
      courseId: productId,
    });
  } else if (type === 'LIVE_CLASS') {
    const liveClass = await prisma.liveClass.findUnique({
      where: { id: productId },
      select: { id: true, title: true, senseiName: true },
    });
    if (!liveClass) return { ok: false, message: 'Live class tidak ditemukan.' };

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_liveClassId: { userId, liveClassId: productId } },
      create: { userId, liveClassId: productId, type: 'LIVE_CLASS', status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
      select: { id: true },
    });
    enrollmentId = enrollment.id;
    productTitle = liveClass.title;
    productSubtitle = liveClass.senseiName;
    await syncLiveClassFilledSlots(productId);
  } else {
    const tryout = await prisma.tryoutSession.findUnique({
      where: { id: productId },
      select: { id: true, title: true, code: true },
    });
    if (!tryout) return { ok: false, message: 'Sesi tryout tidak ditemukan.' };

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_tryoutSessionId: { userId, tryoutSessionId: productId } },
      create: { userId, tryoutSessionId: productId, type: 'TRYOUT', status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
      select: { id: true },
    });
    enrollmentId = enrollment.id;
    productTitle = tryout.title;
    productSubtitle = tryout.code;
  }

  const [studentName, actorName] = await Promise.all([
    resolveEnrollmentActorName(userId),
    resolveEnrollmentActorName(adminId),
  ]);

  await writeEnrollmentLog({
    enrollmentId: enrollmentId ?? null,
    userId,
    actorUserId: adminId,
    type,
    action: 'GRANTED',
    productTitle,
    productSubtitle,
    studentName,
    actorName,
  });

  revalidateStudentLearningSurfaces({ userId });
  revalidatePath(ADMIN_ROUTES.pembayaran);
  revalidatePath(ADMIN_ROUTES.users);
  revalidatePath(ADMIN_ROUTES.userDetail(userId));
  revalidatePath(ADMIN_ROUTES.kursus);
  revalidatePath(ADMIN_ROUTES.liveClass);
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  return { ok: true };
}
