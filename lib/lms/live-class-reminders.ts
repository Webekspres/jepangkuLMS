import {
  buildLiveClassReminderIdempotencyKey,
  sendLiveClassReminderEmail,
} from '@/lib/email/send-live-class-reminder-email';
import { getJakartaDateKey, getJakartaDayBounds } from '@/lib/jakarta-calendar';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { createLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const reminderLog = createLogger('live-class-reminder');

const JAKARTA_TZ = 'Asia/Jakarta';

export type LiveClassReminderRunResult = {
  jakartaDateKey: string;
  sessionsFound: number;
  recipients: number;
  sent: number;
  skipped: number;
  failed: number;
  noEmail: number;
};

export function formatLiveClassReminderDateLabel(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: JAKARTA_TZ,
  });
}

export function formatLiveClassReminderTimeRange(start: Date, end: Date): string {
  const timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: JAKARTA_TZ } as const;
  return `${start.toLocaleTimeString('id-ID', timeOptions)} – ${end.toLocaleTimeString('id-ID', timeOptions)} WIB`;
}

/**
 * Kirim email reminder ke peserta Live Class aktif untuk sesi yang berlangsung
 * pada hari kalender Asia/Jakarta.
 */
export async function sendLiveClassRemindersForToday(
  now = new Date(),
): Promise<LiveClassReminderRunResult> {
  const jakartaDateKey = getJakartaDateKey(now);
  const { start, end } = getJakartaDayBounds(now);

  const sessions = await prisma.liveClassSession.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
      liveClass: { isPublished: true },
    },
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      endsAt: true,
      liveClass: {
        select: {
          id: true,
          title: true,
          senseiName: true,
          enrollments: {
            where: { status: 'ACTIVE', type: 'LIVE_CLASS' },
            select: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  ssoDisplayName: true,
                  ssoEmail: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const result: LiveClassReminderRunResult = {
    jakartaDateKey,
    sessionsFound: sessions.length,
    recipients: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    noEmail: 0,
  };

  const dateLabel = formatLiveClassReminderDateLabel(start);

  for (const session of sessions) {
    const timeLabel = formatLiveClassReminderTimeRange(session.scheduledAt, session.endsAt);

    for (const enrollment of session.liveClass.enrollments) {
      const user = enrollment.user;
      const email = user.ssoEmail?.trim();

      if (!email) {
        result.noEmail += 1;
        reminderLog.warn(
          {
            userId: user.id,
            sessionId: session.id,
            liveClassId: session.liveClass.id,
          },
          'Live class reminder skipped — no email',
        );
        continue;
      }

      result.recipients += 1;

      const sendResult = await sendLiveClassReminderEmail({
        email,
        userId: user.id,
        sessionId: session.id,
        jakartaDateKey,
        name: resolvePublicDisplayName({
          displayName: user.displayName,
          ssoDisplayName: user.ssoDisplayName,
          email,
        }),
        liveClassTitle: session.liveClass.title,
        senseiName: session.liveClass.senseiName,
        dateLabel,
        sessions: [{ title: session.title, timeLabel }],
        liveClassId: session.liveClass.id,
      });

      if (sendResult.ok) {
        result.sent += 1;
        continue;
      }

      if (sendResult.skipped) {
        result.skipped += 1;
        reminderLog.warn(
          {
            userId: user.id,
            sessionId: session.id,
            idempotencyKey: buildLiveClassReminderIdempotencyKey({
              sessionId: session.id,
              userId: user.id,
              jakartaDateKey,
            }),
          },
          'Live class reminder skipped — email not configured',
        );
        continue;
      }

      result.failed += 1;
      reminderLog.error(
        {
          userId: user.id,
          sessionId: session.id,
          error: sendResult.error,
        },
        'Live class reminder send failed',
      );
    }
  }

  reminderLog.info(result, 'Live class reminder run complete');
  return result;
}
