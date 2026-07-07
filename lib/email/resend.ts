import { Resend } from 'resend';
import { getEmailConfig } from '@/lib/email/config';

let client: Resend | null = null;

/** Singleton Resend client — lazy init after env is loaded. */
export function getResendClient(): Resend {
  const { apiKey } = getEmailConfig();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  if (!client) {
    client = new Resend(apiKey);
  }

  return client;
}
