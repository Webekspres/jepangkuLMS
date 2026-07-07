import { render } from '@react-email/render';
import { createLogger } from '@/lib/logger';
import { getEmailConfig } from '@/lib/email/config';
import { getResendClient } from '@/lib/email/resend';
import type { SendEmailInput, SendEmailResult } from '@/lib/email/types';

const emailLog = createLogger('email');

/** Low-level send — templates call this via dedicated send* helpers. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getEmailConfig();

  if (!config.enabled) {
    emailLog.warn('Email send skipped — RESEND_API_KEY not configured');
    return { ok: false, skipped: true, reason: 'not_configured' };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  const html = await render(input.react);

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send(
      {
        from: config.from,
        to,
        subject: input.subject,
        html,
        tags: input.tags,
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    );

    if (error) {
      emailLog.error({ error: error.message, to }, 'Resend API rejected email');
      return { ok: false, skipped: false, error: error.message };
    }

    if (!data?.id) {
      emailLog.error({ to }, 'Resend returned success without message id');
      return { ok: false, skipped: false, error: 'Missing Resend message id' };
    }

    emailLog.info({ messageId: data.id, to, subject: input.subject }, 'Transactional email sent');
    return { ok: true, id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    emailLog.error({ to, error: message }, 'Transactional email send failed');
    return { ok: false, skipped: false, error: message };
  }
}
