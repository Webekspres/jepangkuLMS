import type { ReactElement } from 'react';

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; reason: 'not_configured' }
  | { ok: false; skipped: false; error: string };

export type WelcomeEmailInput = {
  email: string;
  name: string;
  userId?: string;
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  /** Resend idempotency — prevents duplicate sends on webhook retries */
  idempotencyKey?: string;
  tags?: { name: string; value: string }[];
};
