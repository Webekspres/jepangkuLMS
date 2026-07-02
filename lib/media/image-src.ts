import { extractR2StorageKeyFromUrl, normalizeR2PublicUrl } from '@/lib/r2';

/** Rewrite legacy pub-*.r2.dev → R2_PUBLIC_URL; proxy only when still on blocked r2.dev host. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
    if (!url?.trim()) return null;
    const normalized = normalizeR2PublicUrl(url.trim()) ?? url.trim();

    try {
        const parsed = new URL(normalized);
        if (parsed.hostname.endsWith('.r2.dev')) {
            const key = extractR2StorageKeyFromUrl(normalized);
            if (key) return `/api/media/r2?key=${encodeURIComponent(key)}`;
        }
    } catch {
        // blob: etc.
    }

    return normalized;
}

/** Direct load for assets.jepangku.com, Clerk, and LMS media proxy */
export function isUnoptimizedImageSrc(url: string): boolean {
    return (
        url.startsWith('/api/media/r2') ||
        url.includes('assets.jepangku.com') ||
        url.includes('img.clerk.com') ||
        url.includes('images.clerk.dev') ||
        url.startsWith('/badges/')
    );
}
