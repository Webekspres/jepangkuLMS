import { normalizeR2PublicUrl } from '@/lib/r2';

/** Rewrite legacy R2 hosts + trim — use whenever surfacing stored media URLs. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
    if (!url?.trim()) return null;
    return normalizeR2PublicUrl(url.trim()) ?? url.trim();
}

/** ponytail: R2/Clerk often 401 on server-side fetch inside `/_next/image` — load direct in browser */
export function isUnoptimizedImageSrc(url: string): boolean {
    return (
        url.includes('.r2.dev') ||
        url.includes('img.clerk.com') ||
        url.includes('images.clerk.dev') ||
        url.startsWith('/badges/')
    );
}
