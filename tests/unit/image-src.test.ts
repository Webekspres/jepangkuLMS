import { describe, expect, test } from 'bun:test';

process.env.R2_PUBLIC_URL = 'https://pub-new.r2.dev';

import { isUnoptimizedImageSrc, resolveMediaUrl } from '@/lib/media/image-src';

describe('image-src', () => {
    test('resolveMediaUrl rewrites legacy R2 host', () => {
        expect(resolveMediaUrl('https://pub-old.r2.dev/lms/badges/x.png')).toBe(
            'https://pub-new.r2.dev/lms/badges/x.png',
        );
    });

    test('isUnoptimizedImageSrc covers R2, Clerk, and local badges', () => {
        expect(isUnoptimizedImageSrc('https://pub-new.r2.dev/lms/a.png')).toBe(true);
        expect(isUnoptimizedImageSrc('https://img.clerk.com/abc')).toBe(true);
        expect(isUnoptimizedImageSrc('/badges/Word Rookie.png')).toBe(true);
        expect(isUnoptimizedImageSrc('https://images.unsplash.com/x.jpg')).toBe(false);
    });
});
