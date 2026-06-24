import { cookies } from 'next/headers';
import { logApiWarn } from '@/lib/errors/api-error';
import { CORE_JWT_COOKIE } from '@/lib/auth/constants';
import { buildSessionFromVerifiedJwt, type CoreSession } from './session';
import { verifyCoreJwtToken } from './verify-jwt';

export async function getCoreJwtFromCookies(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(CORE_JWT_COOKIE)?.value ?? null;
}

/**
 * Ambil sesi user aktif dari Core JWT (httpOnly cookie).
 * Sumber profil/XP: claims di token — bukan Prisma LMS.
 */
export async function getCoreSession(): Promise<CoreSession | null> {
    const token = await getCoreJwtFromCookies();
    if (!token) {
        return null;
    }

    try {
        const payload = await verifyCoreJwtToken(token);
        return buildSessionFromVerifiedJwt(payload);
    } catch (error) {
        logApiWarn('core.session.verify_failed', {
            message: error instanceof Error ? error.message : String(error),
            hint: 'Core JWT cookie invalid or JEPANGKU_CORE_JWT_PUBLIC_KEY mismatch — call POST /api/auth/core-token',
        });
        return null;
    }
}
