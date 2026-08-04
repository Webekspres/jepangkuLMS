'use server';

import { revalidatePath } from 'next/cache';
import { isLiveClassEnrollmentClosed } from '@/features/live-class/lib/live-class-access';
import { logEnrollmentRequested } from '@/features/admin-cms/lib/enrollment-log';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { evaluateBadgeUnlocks } from '@/lib/lms/badge-unlock';
import { notifyEnrollmentPending, notifyLiveClassRegistration } from '@/lib/lms/notifications';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';
import { isManualPaymentEnabled } from '@/lib/payment/settings';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

export type RequestLiveClassResult =
  | { ok: true; status: 'PENDING' | 'ACTIVE' }
  | { ok: false; message: string };

/**
 * Daftar Live Class.
 * - Gratis → ACTIVE
 * - Berbayar + PAYMENT_PROVIDER=manual → PENDING (admin Setujui)
 * - Berbayar + Midtrans → must use checkout
 */
export async function requestLiveClassEnrollment(
  liveClassId: string,
): Promise<RequestLiveClassResult> {
  const userId = await requireAuthUserWithAnchor();

  const liveClass = await prisma.liveClass.findFirst({
    where: { id: liveClassId, isPublished: true },
    select: {
      id: true,
      title: true,
      senseiName: true,
      priceIdr: true,
      maxSlots: true,
      filledSlots: true,
      sessions: {
        orderBy: { scheduledAt: 'asc' },
        take: 1,
        select: { scheduledAt: true },
      },
    },
  });
  if (!liveClass) return { ok: false, message: 'Live class tidak ditemukan.' };

  const existing = await prisma.enrollment.findUnique({
    where: { userId_liveClassId: { userId, liveClassId } },
    select: { id: true, status: true },
  });

  if (existing?.status === 'ACTIVE') {
    return { ok: true, status: 'ACTIVE' };
  }

  if (liveClass.priceIdr > 0 && !isManualPaymentEnabled()) {
    return {
      ok: false,
      message: 'Live Class berbayar dibayar lewat checkout Midtrans.',
    };
  }

  if (
    existing?.status !== 'PENDING' &&
    isLiveClassEnrollmentClosed(liveClass.sessions[0]?.scheduledAt, new Date())
  ) {
    return {
      ok: false,
      message: 'Pendaftaran live class ini sudah ditutup H-1 sebelum pertemuan pertama.',
    };
  }

  if (existing?.status !== 'PENDING' && liveClass.filledSlots >= liveClass.maxSlots) {
    return { ok: false, message: 'Kelas sudah penuh.' };
  }

  const status = liveClass.priceIdr > 0 ? 'PENDING' : 'ACTIVE';

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_liveClassId: { userId, liveClassId } },
    create: { userId, liveClassId, type: 'LIVE_CLASS', status },
    update: { status },
  });

  if (status === 'PENDING' && existing?.status !== 'PENDING') {
    const studentName = (await resolveLmsDisplayName(userId, null)) ?? 'Siswa';
    await notifyEnrollmentPending({
      enrollmentId: enrollment.id,
      studentUserId: userId,
      studentName,
      courseTitle: `Live Class — ${liveClass.title}`,
    });
    await notifyLiveClassRegistration({
      studentUserId: userId,
      liveClassTitle: liveClass.title,
      priceIdr: liveClass.priceIdr,
    });
    await logEnrollmentRequested({
      enrollmentId: enrollment.id,
      userId,
      type: 'LIVE_CLASS',
      productTitle: liveClass.title,
      productSubtitle: liveClass.senseiName,
      studentName,
    });
  } else if (status === 'ACTIVE') {
    await notifyLiveClassRegistration({
      studentUserId: userId,
      liveClassTitle: liveClass.title,
      priceIdr: liveClass.priceIdr,
    });
  }

  revalidatePath('/admin/pembayaran');
  revalidatePath('/dashboard/live-class');
  revalidatePath(`/dashboard/live-class/${liveClassId}`);
  loggers.learning.info(
    { userId, liveClassId, status: enrollment.status },
    'Live class enrollment requested',
  );
  return { ok: true, status: enrollment.status as 'PENDING' | 'ACTIVE' };
}

/**
 * Best-effort attendance: student opens Zoom/meeting link.
 * Unlocks FIRST_LIVE_CLASS_JOIN badges (idempotent).
 */
export async function recordLiveClassSessionJoinAction(input: {
  liveClassId: string;
  sessionId: string;
}): Promise<{ ok: true; meetingUrl: string } | { ok: false; message: string }> {
  const userId = await requireAuthUserWithAnchor();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_liveClassId: { userId, liveClassId: input.liveClassId } },
    select: { status: true },
  });
  if (enrollment?.status !== 'ACTIVE') {
    return { ok: false, message: 'Daftar Live Class dulu untuk bergabung.' };
  }

  const session = await prisma.liveClassSession.findFirst({
    where: { id: input.sessionId, liveClassId: input.liveClassId },
    select: { meetingUrl: true },
  });
  if (!session?.meetingUrl) {
    return { ok: false, message: 'Link meeting belum tersedia.' };
  }

  await evaluateBadgeUnlocks(userId, { type: 'FIRST_LIVE_CLASS_JOIN' });

  revalidatePath(STUDENT_ROUTES.achievements);
  return { ok: true, meetingUrl: session.meetingUrl };
}
