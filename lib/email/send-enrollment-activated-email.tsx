import { EnrollmentActivatedEmail } from '@/emails/enrollment-activated-email';
import { createLogger } from '@/lib/logger';
import { getEmailConfig } from '@/lib/email/config';
import { sendEmail } from '@/lib/email/send-email';
import type { EnrollmentActivatedEmailInput, SendEmailResult } from '@/lib/email/types';

const emailLog = createLogger('email');

export function buildEnrollmentActivatedIdempotencyKey(enrollmentId: string): string {
  return `lms:enrollment-activated:${enrollmentId}`;
}

export function buildEnrollmentActivatedSubject(productTitle: string): string {
  return `Akses aktif: ${productTitle}`;
}

export async function sendEnrollmentActivatedEmail(
  input: EnrollmentActivatedEmailInput,
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  const path = input.href.startsWith('/') ? input.href : `/${input.href}`;
  const ctaUrl = `${config.appUrl.replace(/\/$/, '')}${path}`;

  return sendEmail({
    to: input.email,
    subject: buildEnrollmentActivatedSubject(input.productTitle),
    react: (
      <EnrollmentActivatedEmail
        name={input.name}
        productTitle={input.productTitle}
        productKindLabel={input.productKindLabel}
        ctaUrl={ctaUrl}
        ctaLabel={input.ctaLabel}
        appUrl={config.appUrl}
        logoUrl={config.logoUrl}
      />
    ),
    idempotencyKey: buildEnrollmentActivatedIdempotencyKey(input.enrollmentId),
    tags: [
      { name: 'category', value: 'transactional' },
      { name: 'template', value: 'enrollment-activated' },
    ],
  });
}

/** Fire-and-forget — safe after notify helpers. Never throws. */
export function dispatchEnrollmentActivatedEmail(input: EnrollmentActivatedEmailInput): void {
  void sendEnrollmentActivatedEmail(input).then((result) => {
    if (result.ok || result.skipped) return;
    emailLog.error(
      {
        email: input.email,
        enrollmentId: input.enrollmentId,
        error: result.error,
      },
      'Enrollment activated email dispatch failed',
    );
  });
}
