import type { CoreSession } from '@/lib/core/session';
import { logApiWarn } from '@/lib/errors/api-error';

/** Core JWT `sub` claim — canonical user id from Core. */
export function coreSessionUserId(session: CoreSession | null): string | null {
    return session?.claims.sub ?? null;
}

/** Reject stale Core JWT cookies that belong to a different Clerk session. */
export function isCoreSessionForClerkUser(
    session: CoreSession | null,
    clerkUserId: string | null | undefined,
): boolean {
    if (!session || !clerkUserId) return false;
    return session.claims.sub === clerkUserId;
}

export function logCoreSessionUserMismatch(
    clerkUserId: string,
    coreJwtSub: string,
    source: string,
): void {
    logApiWarn('auth.core_session.user_mismatch', {
        clerkUserId,
        coreJwtSub,
        source,
        hint: 'Stale jepangku_core_jwt cookie — POST /api/auth/core-token or sign out',
    });
}
