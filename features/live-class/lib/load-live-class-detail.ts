import { cache } from 'react';
import type { EnrollmentStatus, LevelJLPT } from '@prisma/client';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { prisma } from '@/lib/prisma';
import {
  resolveLiveSessionStatus,
  type LiveSessionStatus,
} from '@/features/live-class/lib/session-access';

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
  thumbUrl: string | null;
  isFull: boolean;
  sessionCount: number;
  isEnrolled: boolean;
  enrollmentStatus: EnrollmentStatus | 'NONE';
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
      select: { status: true },
    }),
  ]);

  if (!row) return null;

  const isEnrolled = enrollment?.status === 'ACTIVE';
  const now = new Date();

  const sessions: LiveClassDetailSession[] = row.sessions.map((session) => {
    const status = resolveLiveSessionStatus(session.scheduledAt, session.endsAt, now);
    return {
      id: session.id,
      title: session.title,
      scheduledAtISO: session.scheduledAt.toISOString(),
      endsAtISO: session.endsAt.toISOString(),
      dateLabel: session.scheduledAt.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      timeLabel: `${session.scheduledAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} – ${session.endsAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
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
    thumbUrl: row.thumbUrl,
    isFull: row.filledSlots >= row.maxSlots,
    sessionCount: row.sessions.length,
    isEnrolled,
    enrollmentStatus: enrollment?.status ?? 'NONE',
    sessions,
  };
});
