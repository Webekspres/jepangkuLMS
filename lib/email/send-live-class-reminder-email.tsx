import { LiveClassReminderEmail } from '@/emails/live-class-reminder-email';
import { getEmailConfig } from '@/lib/email/config';
import { sendEmail } from '@/lib/email/send-email';
import type { LiveClassReminderEmailInput, SendEmailResult } from '@/lib/email/types';

export function buildLiveClassReminderIdempotencyKey(input: {
  sessionId: string;
  userId: string;
  jakartaDateKey: string;
}): string {
  return `lms:live-class-reminder:${input.sessionId}:${input.userId}:${input.jakartaDateKey}`;
}

export function buildLiveClassReminderSubject(liveClassTitle: string): string {
  return `Reminder Live Class hari ini — ${liveClassTitle}`;
}

/** Send daily Live Class reminder via Resend. */
export async function sendLiveClassReminderEmail(
  input: LiveClassReminderEmailInput,
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const detailUrl = `${config.appUrl}/dashboard/live-class/${input.liveClassId}`;

  return sendEmail({
    to: input.email,
    subject: buildLiveClassReminderSubject(input.liveClassTitle),
    react: (
      <LiveClassReminderEmail
        name={input.name}
        liveClassTitle={input.liveClassTitle}
        senseiName={input.senseiName}
        dateLabel={input.dateLabel}
        sessions={input.sessions}
        detailUrl={detailUrl}
        appUrl={config.appUrl}
        logoUrl={config.logoUrl}
      />
    ),
    idempotencyKey: buildLiveClassReminderIdempotencyKey({
      sessionId: input.sessionId,
      userId: input.userId,
      jakartaDateKey: input.jakartaDateKey,
    }),
    tags: [
      { name: 'category', value: 'transactional' },
      { name: 'template', value: 'live-class-reminder' },
    ],
  });
}
