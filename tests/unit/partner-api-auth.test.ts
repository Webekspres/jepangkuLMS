import { describe, expect, test } from 'bun:test';
import {
  getPartnerApiKey,
  isPartnerApiEnabled,
  readPartnerApiKeyFromRequest,
  verifyPartnerApiRequest,
} from '@/lib/api/partner-auth';

const ORIGINAL_KEY = process.env.LMS_PARTNER_API_KEY;

function setPartnerKey(value: string | undefined) {
  if (value === undefined) {
    delete process.env.LMS_PARTNER_API_KEY;
  } else {
    process.env.LMS_PARTNER_API_KEY = value;
  }
}

describe('partner-api-auth', () => {
  test('disabled when env key is missing', () => {
    setPartnerKey(undefined);
    expect(isPartnerApiEnabled()).toBe(false);
    expect(getPartnerApiKey()).toBeNull();
  });

  test('reads bearer token and verifies request', () => {
    setPartnerKey('partner-secret-key');
    const request = new Request('https://kursus.jepangku.com/api/v1/public/courses', {
      headers: { authorization: 'Bearer partner-secret-key' },
    });

    expect(readPartnerApiKeyFromRequest(request)).toBe('partner-secret-key');
    expect(verifyPartnerApiRequest(request)).toBe(true);
  });

  test('reads x-lms-api-key header', () => {
    setPartnerKey('header-key');
    const request = new Request('https://kursus.jepangku.com/api/v1/public/courses', {
      headers: { 'x-lms-api-key': 'header-key' },
    });

    expect(verifyPartnerApiRequest(request)).toBe(true);
  });

  test('rejects wrong key', () => {
    setPartnerKey('correct-key');
    const request = new Request('https://kursus.jepangku.com/api/v1/public/courses', {
      headers: { authorization: 'Bearer wrong-key' },
    });

    expect(verifyPartnerApiRequest(request)).toBe(false);
  });
});

setPartnerKey(ORIGINAL_KEY);
