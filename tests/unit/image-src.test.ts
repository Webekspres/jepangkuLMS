import { describe, expect, test } from 'bun:test';

process.env.R2_PUBLIC_URL = 'https://assets.jepangku.com';

import { isUnoptimizedImageSrc, resolveMediaUrl } from '@/lib/media/image-src';

describe('image-src', () => {
    test('resolveMediaUrl rewrites legacy r2.dev to assets domain', () => {
        expect(resolveMediaUrl('https://pub-old.r2.dev/lms/badges/x.png')).toBe(
            'https://assets.jepangku.com/lms/badges/x.png',
        );
        expect(resolveMediaUrl('https://pub-old.r2.dev/avatars/user/a.webp')).toBe(
            'https://assets.jepangku.com/avatars/user/a.webp',
        );
    });

    test('resolveMediaUrl keeps assets.jepangku.com URLs', () => {
        expect(resolveMediaUrl('https://assets.jepangku.com/lms/avatars/u/a.webp')).toBe(
            'https://assets.jepangku.com/lms/avatars/u/a.webp',
        );
    });

    test('isUnoptimizedImageSrc covers assets, proxy, Clerk, badges', () => {
        expect(isUnoptimizedImageSrc('https://assets.jepangku.com/lms/a.png')).toBe(true);
        expect(isUnoptimizedImageSrc('/api/media/r2?key=lms%2Fa.png')).toBe(true);
        expect(isUnoptimizedImageSrc('https://img.clerk.com/abc')).toBe(true);
        expect(isUnoptimizedImageSrc('/badges/Word Rookie.png')).toBe(true);
        expect(isUnoptimizedImageSrc('https://images.unsplash.com/x.jpg')).toBe(false);
    });
});
