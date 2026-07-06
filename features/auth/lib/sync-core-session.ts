'use client';

/** Tukar Clerk session → Core JWT tanpa redirect (background). */
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

/** Retry sampai cookie Clerk terbaca server atau batas waktu habis. */
const CORE_SESSION_RETRY_DELAYS_MS = [0, 400, 800, 1500, 2500, 4000, 6000, 8000];

export async function ensureCoreSessionWithRetry(): Promise<boolean> {
    for (const delay of CORE_SESSION_RETRY_DELAYS_MS) {
        if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        if (await syncCoreSessionSilent()) {
            return true;
        }
    }
    return false;
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
