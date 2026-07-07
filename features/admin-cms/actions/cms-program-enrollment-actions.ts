'use server';

import type { EnrollmentType } from '@prisma/client';
import { loadProgramEnrollments } from '@/features/admin-cms/lib/load-admin-program-enrollments';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { uuidSchema } from '@/lib/validations/shared';

export async function loadProgramEnrollmentsAction(
  type: EnrollmentType,
  productId: string,
) {
  await requireAdminAction();

  const parsedId = uuidSchema.safeParse(productId);
  if (!parsedId.success) {
    return { ok: false as const, message: 'Program tidak valid.' };
  }

  const rows = await loadProgramEnrollments(type, parsedId.data);
  return { ok: true as const, rows };
}
