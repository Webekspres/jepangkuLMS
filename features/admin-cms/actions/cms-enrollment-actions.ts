'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
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
    select: { userId: true },
  });

  revalidateStudentLearningSurfaces({ userId: enrollment.userId });
  revalidatePath(ADMIN_ROUTES.pembayaran);
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
    select: { userId: true },
  });

  revalidateStudentLearningSurfaces({ userId: enrollment.userId });
  revalidatePath(ADMIN_ROUTES.pembayaran);
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

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  });

  revalidateStudentLearningSurfaces({ userId });
  revalidatePath(ADMIN_ROUTES.pembayaran);
  return { ok: true };
}
