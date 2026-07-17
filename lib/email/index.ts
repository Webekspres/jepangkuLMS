export { getEmailConfig, isEmailEnabled } from '@/lib/email/config';
export { getResendClient } from '@/lib/email/resend';
export { sendEmail } from '@/lib/email/send-email';
export { dispatchWelcomeEmail, sendWelcomeEmail } from '@/lib/email/send-welcome-email';
export {
  buildLiveClassReminderIdempotencyKey,
  buildLiveClassReminderSubject,
  sendLiveClassReminderEmail,
} from '@/lib/email/send-live-class-reminder-email';
export { parseClerkUserCreatedEvent } from '@/lib/email/parse-clerk-user-created';
export type {
  LiveClassReminderEmailInput,
  SendEmailInput,
  SendEmailResult,
  WelcomeEmailInput,
} from '@/lib/email/types';
export type { ClerkUserCreatedPayload } from '@/lib/email/parse-clerk-user-created';
