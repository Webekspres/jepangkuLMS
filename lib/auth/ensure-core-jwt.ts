import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { getCoreJwtCookieOptions } from '@/lib/auth/cookie-options';
import { isCoreApiConfigured } from '@/lib/core/client';
import { exchangeClerkSessionForCoreJwtWithRetry } from '@/lib/core/exchange-token-with-retry';
import { getCoreJwtFromCookies } from '@/lib/core/get-core-session';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { loggers, serializeError } from '@/lib/logger';

const authLog = loggers.auth.child({ fn: 'ensureCoreJwtCookie' });

/** Best-effort Clerk → Core JWT exchange on server (dashboard layout). */
export async function ensureCoreJwtCookie(): Promise<boolean> {
    if (!isCoreIntegrationEnabled() || !isCoreApiConfigured()) {
        return false;
    }

    const existing = await getCoreJwtFromCookies();
    if (existing) {
        return true;
    }

    const { userId, getToken } = await auth();
    if (!userId) {
        return false;
    }

    const clerkToken = await getToken();
    if (!clerkToken) {
        authLog.warn({ userId }, 'Core JWT ensure skipped — Clerk session token missing');
        return false;
    }

    try {
        const { token } = await exchangeClerkSessionForCoreJwtWithRetry(clerkToken);
        const cookieStore = await cookies();
        cookieStore.set(CORE_JWT_COOKIE, token, getCoreJwtCookieOptions());
        authLog.info({ userId }, 'Core JWT cookie set via server ensure');
        return true;
    } catch (error) {
        authLog.warn(
            { userId, ...serializeError(error) },
            'Core JWT ensure failed — LMS continues with local profile',
        );
        return false;
    }
}
