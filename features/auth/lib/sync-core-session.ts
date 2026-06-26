'use client';

import { AUTH_ROUTES } from '@/lib/auth/constants';

/** Tukar Clerk session → Core JWT tanpa redirect (background / shadow mode). */
export async function syncCoreSessionSilent(): Promise<boolean> {
    try {
        const response = await fetch('/api/auth/core-token', {
            method: 'POST',
            credentials: 'include',
        });
        return response.ok;
    } catch {
        return false;
    }
}

/** Setelah Clerk session aktif, tukar ke Core JWT lalu redirect dashboard */
export async function syncCoreSessionAndRedirect(
    redirectTo: string = AUTH_ROUTES.dashboard,
): Promise<{ ok: true } | { ok: false; message: string; code?: string }> {
    const response = await fetch('/api/auth/core-token', {
        method: 'POST',
        credentials: 'include',
    });

    if (!response.ok) {
        let message = 'Gagal memuat profil belajar Anda. Silakan coba lagi.';
        let code: string | undefined;
        try {
            const body = (await response.json()) as {
                error?: string | { code?: string; message?: string };
                code?: string;
            };
            if (typeof body.error === 'string') {
                message = body.error;
            } else if (body.error && typeof body.error === 'object') {
                if (body.error.message) message = body.error.message;
                if (body.error.code) code = body.error.code;
            }
            if (!code && body.code) code = body.code;
        } catch {
            // ignore
        }
        return { ok: false, message, code };
    }

    window.location.assign(redirectTo);
    return { ok: true };
}

export function mapClerkError(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'errors' in err) {
        const first = (err as { errors?: { longMessage?: string; message?: string; code?: string }[] })
            .errors?.[0];
        const message = first?.longMessage ?? first?.message ?? fallback;

        if (
            message.toLowerCase().includes('verification strategy') ||
            first?.code === 'strategy_for_user_invalid'
        ) {
            return 'Akun ini didaftarkan via Google. Gunakan "Masuk dengan Google", bukan password.';
        }

        return message;
    }

    if (err instanceof Error && err.message) {
        return err.message;
    }

    return fallback;
}
