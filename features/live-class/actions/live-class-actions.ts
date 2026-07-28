'use server';

import { revalidatePath } from 'next/cache';
import { isLiveClassEnrollmentClosed } from '@/features/live-class/lib/live-class-access';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { notifyEnrollmentPending, notifyLiveClassRegistration } from '@/lib/lms/notifications';
import { logEnrollmentRequested } from '@/features/admin-cms/lib/enrollment-log';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

export type RequestLiveClassResult =
  | { ok: true; status: 'PENDING' | 'ACTIVE' }
  | { ok: false; message: string };

/**
 * Daftar ke sebuah program Live Class.
 * - Berbayar → enrollment PENDING (menunggu verifikasi admin) + notifikasi admin.
 * - Gratis   → langsung ACTIVE.
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

  if (!existing && isLiveClassEnrollmentClosed(liveClass.sessions[0]?.scheduledAt, new Date())) {
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
