import { cache } from 'react';
import type { EnrollmentStatus, LevelJLPT } from '@prisma/client';
import { isLiveClassEnrollmentClosed } from '@/features/live-class/lib/live-class-access';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { prisma } from '@/lib/prisma';
import type { PaymentSettings } from '@/lib/payment/enrollment-payment-messages';
import { getPaymentSettings } from '@/lib/payment/settings';
import {
  resolveLiveSessionStatus,
  type LiveSessionStatus,
} from '@/features/live-class/lib/session-access';
import {
  formatJakartaDateLong,
  formatJakartaTimeRange,
} from '@/lib/jakarta-calendar';

export type LiveClassDetailSession = {
  id: string;
  title: string;
  /** ISO — dipakai client untuk hitung ulang status secara real-time. */
  scheduledAtISO: string;
  endsAtISO: string;
  dateLabel: string;
  timeLabel: string;
  status: LiveSessionStatus;
  /**
   * Link meeting & rekaman hanya dikirim ke klien jika user enrolled
   * (enrollment = batas otorisasi). Visibilitas tombol per status diatur di UI.
   */
  meetingUrl: string | null;
  recordingUrl: string | null;
};

export type LiveClassDetailView = {
  id: string;
  title: string;
  description: string;
  senseiName: string;
  senseiLevel: string | null;
  category: string;
  level: LevelJLPT;
  priceIdr: number;
  maxSlots: number;
  filledSlots: number;
  coverImageUrl: string | null;
  paymentLink: string | null;
  paymentSettings: PaymentSettings;
  isFull: boolean;
  sessionCount: number;
  isEnrolled: boolean;
  enrollmentStatus: EnrollmentStatus | 'NONE';
  pendingPaymentId: string | null;
  enrollmentClosed: boolean;
  accessMessage: string | null;
  sessions: LiveClassDetailSession[];
};

export const loadLiveClassDetail = cache(async function loadLiveClassDetail(
  id: string,
): Promise<LiveClassDetailView | null> {
  const userId = await requireAuthUserId();

  const [row, enrollment] = await Promise.all([
    prisma.liveClass.findFirst({
      where: { id, isPublished: true },
      include: { sessions: { orderBy: { scheduledAt: 'asc' } } },
    }),
    prisma.enrollment.findUnique({
      where: { userId_liveClassId: { userId, liveClassId: id } },
      select: {
        status: true,
        payment: { select: { id: true, status: true } },
      },
    }),
  ]);

  if (!row) return null;

  const isEnrolled = enrollment?.status === 'ACTIVE';
  const pendingPaymentId =
    enrollment?.payment?.status === 'PENDING' || enrollment?.payment?.status === 'CHALLENGE'
      ? enrollment.payment.id
      : null;
  const now = new Date();
  const enrollmentClosed = isLiveClassEnrollmentClosed(row.sessions[0]?.scheduledAt, now);
  const accessMessage =
    !isEnrolled && enrollmentClosed
      ? 'Pendaftaran live class ini sudah ditutup H-1 sebelum pertemuan pertama.'
      : null;

  const sessions: LiveClassDetailSession[] = row.sessions.map((session) => {
    const status = resolveLiveSessionStatus(session.scheduledAt, session.endsAt, now);
    return {
      id: session.id,
      title: session.title,
      scheduledAtISO: session.scheduledAt.toISOString(),
      endsAtISO: session.endsAt.toISOString(),
      dateLabel: formatJakartaDateLong(session.scheduledAt),
      timeLabel: formatJakartaTimeRange(session.scheduledAt, session.endsAt),
      status,
      meetingUrl: isEnrolled ? session.meetingUrl : null,
      recordingUrl: isEnrolled ? session.recordingUrl : null,
    };
  });

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    senseiName: row.senseiName,
    senseiLevel: row.senseiLevel,
    category: row.category,
    level: row.level,
    priceIdr: row.priceIdr,
    maxSlots: row.maxSlots,
    filledSlots: row.filledSlots,
    coverImageUrl: row.coverImageUrl,
    paymentLink: row.paymentLink,
    paymentSettings: getPaymentSettings(),
    isFull: row.filledSlots >= row.maxSlots,
    sessionCount: row.sessions.length,
    isEnrolled,
    enrollmentStatus: enrollment?.status ?? 'NONE',
    pendingPaymentId,
    enrollmentClosed,
    accessMessage,
    sessions,
  };
});
