import { AUTH_ROUTES } from '@/lib/auth/constants';
import { getAuthRedirectUrl } from '@/lib/auth/redirect-url';
import { clearCachedStudentCoreData } from '@/features/student/lib/student-core-data-cache';

type ClerkSignOut = (options?: { redirectUrl?: string }) => Promise<void> | void;

/**
 * Keluar dari LMS: hapus cookie Core JWT (best-effort) lalu Clerk signOut.
 * Pakai URL absolut agar tidak ter-redirect ke Clerk Account Portal (accounts.dev).
 * Fallback hard redirect jika Clerk signOut gagal.
 */
export async function signOutFromApp(
  signOut: ClerkSignOut,
  redirectPath: string = AUTH_ROUTES.signIn,
): Promise<void> {
  const redirectUrl = getAuthRedirectUrl(redirectPath);

  clearCachedStudentCoreData();

  try {
    await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
  } catch {
    // Tetap keluar dari Clerk meski cookie Core gagal dihapus
  }

  try {
    await signOut({ redirectUrl });
  } catch {
    window.location.assign(redirectUrl);
    return;
  }

  // Safety net — jika Clerk tidak redirect (sesi aneh / popup OAuth)
  window.setTimeout(() => {
    const onProtected =
      window.location.pathname.startsWith('/dashboard') ||
      window.location.pathname.startsWith('/admin');
    if (onProtected) {
      window.location.assign(redirectUrl);
    }
  }, 1500);
}
