import { getCoreJwtFromCookies } from '@/lib/core/get-core-session';
import { isCoreApiConfigured } from '@/lib/core/client';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';

/**
 * Read-only check: apakah cookie Core JWT sudah ada (SSR / Server Actions).
 *
 * Cookie hanya boleh ditulis lewat Route Handler `POST /api/auth/core-token`
 * atau dihapus lewat `POST /api/auth/sign-out` — bukan dari Server Component/Layout.
 * Sinkronisasi client: `CoreSessionSync` + `syncCoreSessionSilent()`.
 */
export async function hasCoreJwtCookie(): Promise<boolean> {
    if (!isCoreIntegrationEnabled() || !isCoreApiConfigured()) {
        return false;
    }

    const existing = await getCoreJwtFromCookies();
    return Boolean(existing);
}
