import 'server-only';

import { syncLiveClassFilledSlots } from '@/features/admin-cms/lib/enrollment-counts';
import {
  resolveEnrollmentActorName,
  writeEnrollmentLog,
} from '@/features/admin-cms/lib/enrollment-log';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';
import {
  isOpenMidtransPaymentStatus,
  isTerminalPaymentStatus,
} from '@/lib/payment/payment-status';
import { prisma } from '@/lib/prisma';

export { isOpenMidtransPaymentStatus, isTerminalPaymentStatus };

/**
 * Delete PENDING enrollment after Payment becomes terminal (cancel/expire/fail).
 * Mirrors admin Batalkan audit trail without requiring an admin actor.
 */
export async function closePendingEnrollmentForTerminalPayment(input: {
  enrollmentId: string;
  actorUserId?: string | null;
}): Promise<{ closed: boolean; revalidatePaths: string[] }> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: input.enrollmentId },
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      liveClassId: true,
      course: { select: { title: true, slug: true } },
      liveClass: { select: { id: true, title: true, senseiName: true } },
      tryoutSession: { select: { title: true, code: true } },
    },
  });

  if (!enrollment || enrollment.status !== 'PENDING') {
    return { closed: false, revalidatePaths: [] };
  }

  await prisma.enrollment.delete({ where: { id: enrollment.id } });

  if (enrollment.type === 'LIVE_CLASS' && enrollment.liveClassId) {
    await syncLiveClassFilledSlots(enrollment.liveClassId);
  }

  const productTitle =
    enrollment.course?.title ??
    enrollment.liveClass?.title ??
    enrollment.tryoutSession?.title ??
    'Program';
  const productSubtitle =
    enrollment.course?.slug ??
    enrollment.liveClass?.senseiName ??
    enrollment.tryoutSession?.code ??
    null;

  const studentName = await resolveLmsDisplayName(enrollment.userId, null);
  const actorName = input.actorUserId
    ? await resolveEnrollmentActorName(input.actorUserId)
    : 'Sistem';

  await writeEnrollmentLog({
    enrollmentId: null,
    userId: enrollment.userId,
    actorUserId: input.actorUserId ?? null,
    type: enrollment.type,
    action: 'REJECTED',
    productTitle,
    productSubtitle,
    studentName,
    actorName,
  });

  const revalidatePaths = [
    '/admin/pembayaran',
    STUDENT_ROUTES.home,
    STUDENT_ROUTES.kursus,
    STUDENT_ROUTES.kursusSaya,
    STUDENT_ROUTES.liveClass,
    STUDENT_ROUTES.tryout,
    STUDENT_ROUTES.pembayaranHistory,
  ];

  if (enrollment.course?.slug) {
    revalidatePaths.push(STUDENT_ROUTES.kursusDetail(enrollment.course.slug));
  }
  if (enrollment.liveClass?.id) {
    revalidatePaths.push(STUDENT_ROUTES.liveClassDetail(enrollment.liveClass.id));
  }
  if (enrollment.tryoutSession?.code) {
    revalidatePaths.push(STUDENT_ROUTES.tryoutExam(enrollment.tryoutSession.code));
  }

  return { closed: true, revalidatePaths };
}
