import { timingSafeEqual } from 'crypto';

const BEARER_PREFIX = 'Bearer ';

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function getPartnerApiKey(): string | null {
  const key = process.env.LMS_PARTNER_API_KEY?.trim();
  return key || null;
}

export function isPartnerApiEnabled(): boolean {
  return getPartnerApiKey() !== null;
}

/** Read key from `Authorization: Bearer …` or `X-LMS-API-Key`. */
export function readPartnerApiKeyFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith(BEARER_PREFIX)) {
    const token = authHeader.slice(BEARER_PREFIX.length).trim();
    return token || null;
  }

  const headerKey = request.headers.get('x-lms-api-key')?.trim();
  return headerKey || null;
}

export function verifyPartnerApiRequest(request: Request): boolean {
  const configured = getPartnerApiKey();
  if (!configured) return false;

  const provided = readPartnerApiKeyFromRequest(request);
  if (!provided) return false;

  return safeEqualString(provided, configured);
}
