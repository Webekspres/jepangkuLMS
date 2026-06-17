import { isCoreApiConfigured } from './client';

/** JepangKu Core — env helpers (server-only). */

export function getCoreServiceToken(): string | null {
  return process.env.JEPANGKU_CORE_SERVICE_TOKEN?.trim() || null;
}

export function isCoreAwardConfigured(): boolean {
  return Boolean(isCoreApiConfigured() && getCoreServiceToken());
}

export const CORE_APPLICATION_LMS = 'LMS' as const;
