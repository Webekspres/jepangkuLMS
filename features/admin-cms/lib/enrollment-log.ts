import type { EnrollmentLogAction, EnrollmentType } from '@prisma/client';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';

export {
  ENROLLMENT_LOG_ACTION_BADGE,
  ENROLLMENT_LOG_ACTION_LABEL,
} from '@/features/admin-cms/lib/enrollment-log-labels';

export type WriteEnrollmentLogInput = {
  enrollmentId?: string | null;
  userId: string;
  actorUserId?: string | null;
  type: EnrollmentType;
  action: EnrollmentLogAction;
  productTitle: string;
  productSubtitle?: string | null;
  studentName?: string | null;
  actorName?: string | null;
};

export async function resolveEnrollmentActorName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, ssoDisplayName: true },
  });
  if (!user) return userId.slice(0, 12);
  return (
    resolvePublicDisplayName({
      displayName: user.displayName,
      ssoDisplayName: user.ssoDisplayName,
    }) || userId.slice(0, 12)
  );
}

export async function writeEnrollmentLog(input: WriteEnrollmentLogInput): Promise<void> {
  await prisma.enrollmentLog.create({
    data: {
      enrollmentId: input.enrollmentId ?? null,
      userId: input.userId,
      actorUserId: input.actorUserId ?? null,
      type: input.type,
      action: input.action,
      productTitle: input.productTitle,
      productSubtitle: input.productSubtitle ?? null,
      studentName: input.studentName ?? null,
      actorName: input.actorName ?? null,
    },
  });
}

export async function logEnrollmentRequested(input: {
  enrollmentId: string;
  userId: string;
  type: EnrollmentType;
  productTitle: string;
  productSubtitle?: string | null;
  studentName: string;
}): Promise<void> {
  await writeEnrollmentLog({
    enrollmentId: input.enrollmentId,
    userId: input.userId,
    actorUserId: input.userId,
    type: input.type,
    action: 'REQUESTED',
    productTitle: input.productTitle,
    productSubtitle: input.productSubtitle ?? null,
    studentName: input.studentName,
    actorName: input.studentName,
  });
}
