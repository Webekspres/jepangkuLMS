import { describe, expect, test } from 'bun:test';

// Set R2_PUBLIC_URL before importing the module so that r2Config reads it at module load time
process.env.R2_PUBLIC_URL = 'https://pub-xxxx.r2.dev';

import { extractR2KeyFromUrl } from '@/lib/r2';

describe('R2 Key Helper', () => {
  test('extractR2KeyFromUrl extracts the S3 Key and strips the lms/ prefix', () => {
    // URL containing the prefix 'lms/' should extract and strip the prefix
    const urlWithPrefix = 'https://pub-xxxx.r2.dev/lms/avatars/user123/profile.png';
    expect(extractR2KeyFromUrl(urlWithPrefix)).toBe('avatars/user123/profile.png');

    // URL NOT containing the prefix 'lms/' (e.g. legacy URLs) should extract the key directly
    const urlWithoutPrefix = 'https://pub-xxxx.r2.dev/avatars/user123/profile.png';
    expect(extractR2KeyFromUrl(urlWithoutPrefix)).toBe('avatars/user123/profile.png');

    // URL from a mismatched hostname/domain should return null
    const wrongUrl = 'https://other-bucket.r2.dev/lms/avatars/user123/profile.png';
    expect(extractR2KeyFromUrl(wrongUrl)).toBeNull();
  });
});
