import { WelcomeEmail } from '@/emails/welcome-email';
import { createLogger } from '@/lib/logger';
import { getEmailConfig } from '@/lib/email/config';
import { sendEmail } from '@/lib/email/send-email';
import type { SendEmailResult, WelcomeEmailInput } from '@/lib/email/types';

const emailLog = createLogger('email');

function welcomeSubject(name: string): string {
  return `Hajimemashite, ${name}! 🇯🇵`;
}

function welcomeIdempotencyKey(userId?: string, email?: string): string {
  if (userId) return `lms:welcome:${userId}`;
  return `lms:welcome:${email ?? 'unknown'}`;
}

/** Send welcome email via Resend (await — use dispatchWelcomeEmail for fire-and-forget). */
export async function sendWelcomeEmail(
  input: WelcomeEmailInput,
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const { email, name, userId } = input;

  return sendEmail({
    to: email,
    subject: welcomeSubject(name),
    react: (
      <WelcomeEmail name={name} appUrl={config.appUrl} logoUrl={config.logoUrl} />
    ),
    idempotencyKey: welcomeIdempotencyKey(userId, email),
    tags: [
      { name: 'category', value: 'transactional' },
      { name: 'template', value: 'welcome' },
    ],
  });
}

/**
 * Non-blocking welcome email — safe for webhooks / registration handlers.
 * Failures are logged; never throws to caller.
 */
export function dispatchWelcomeEmail(input: WelcomeEmailInput): void {
  void sendWelcomeEmail(input).then((result) => {
    if (result.ok || result.skipped) return;

    emailLog.error(
      { email: input.email, userId: input.userId, error: result.error },
      'Welcome email dispatch failed',
    );
  });
}
