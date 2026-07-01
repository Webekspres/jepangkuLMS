import { timingSafeEqual } from 'crypto';

const BEARER_PREFIX = 'Bearer ';

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function getCronSecret(): string | null {
  return process.env.LMS_CRON_SECRET?.trim() || null;
}

export function isCronEnabled(): boolean {
  return getCronSecret() !== null;
}

/** Read secret from `Authorization: Bearer …` or `X-Cron-Secret`. */
function readCronSecretFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith(BEARER_PREFIX)) {
    const token = authHeader.slice(BEARER_PREFIX.length).trim();
    return token || null;
  }
  const headerKey = request.headers.get('x-cron-secret')?.trim();
  return headerKey || null;
}

export function verifyCronRequest(request: Request): boolean {
  const configured = getCronSecret();
  if (!configured) return false;

  const provided = readCronSecretFromRequest(request);
  if (!provided) return false;

  return safeEqualString(provided, configured);
}
