'use client';

import { AUTH_ROUTES } from '@/lib/auth/constants';
import { getAuthRedirectUrl } from '@/lib/auth/redirect-url';

type ClerkSignOut = (options?: { redirectUrl?: string }) => Promise<void> | void;

/**
 * Bersihkan sesi Clerk + cookie Core setelah OAuth gagal / redirect error.
 * Penting untuk akun yang pernah login lewat accounts.dev (state OAuth stale).
 */
export async function resetClerkOAuthSession(
  signOut?: ClerkSignOut,
  options?: { stayOnPage?: boolean },
): Promise<void> {
  try {
    await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
  } catch {
    // ignore
  }

  try {
    if (signOut) {
      if (options?.stayOnPage) {
        await signOut();
      } else {
        await signOut({ redirectUrl: getAuthRedirectUrl(AUTH_ROUTES.signIn) });
      }
    }
  } catch {
    // ignore — tetap hard reload di bawah
  }

  if (options?.stayOnPage) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    window.location.replace(`${url.pathname}${url.search}`);
    return;
  }

  window.location.assign(getAuthRedirectUrl(AUTH_ROUTES.signIn));
}
