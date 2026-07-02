import { describe, expect, test } from 'bun:test';

// Set R2_PUBLIC_URL before importing the module so that r2Config reads it at module load time
process.env.R2_PUBLIC_URL = 'https://pub-xxxx.r2.dev';

import { extractR2KeyFromUrl, extractR2StorageKeyFromUrl, normalizeR2PublicUrl } from '@/lib/r2';

describe('R2 Key Helper', () => {
    test('normalizeR2PublicUrl rewrites legacy pub-* host to configured R2_PUBLIC_URL', () => {
        const legacy =
            'https://pub-old.r2.dev/avatars/user123/profile.png';
        expect(normalizeR2PublicUrl(legacy)).toBe(
            'https://pub-xxxx.r2.dev/avatars/user123/profile.png',
        );
        expect(normalizeR2PublicUrl('https://img.clerk.com/photo.jpg')).toBe(
            'https://img.clerk.com/photo.jpg',
        );
    });

    test('extractR2KeyFromUrl extracts the S3 Key and strips the lms/ prefix', () => {
        const urlWithPrefix = 'https://pub-xxxx.r2.dev/lms/avatars/user123/profile.png';
        expect(extractR2KeyFromUrl(urlWithPrefix)).toBe('avatars/user123/profile.png');

        const urlWithoutPrefix = 'https://pub-xxxx.r2.dev/avatars/user123/profile.png';
        expect(extractR2KeyFromUrl(urlWithoutPrefix)).toBe('avatars/user123/profile.png');

        const legacyHost = 'https://pub-old.r2.dev/lms/avatars/user123/profile.png';
        expect(extractR2KeyFromUrl(legacyHost)).toBe('avatars/user123/profile.png');
    });
});
