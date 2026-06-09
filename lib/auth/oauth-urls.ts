import { AUTH_ROUTES } from './constants';
import { getAuthRedirectUrl } from './redirect-url';

/** Satu callback OAuth untuk sign-in & sign-up — daftarkan URL ini di Clerk Dashboard */
export function getOAuthCallbackUrl(): string {
  return getAuthRedirectUrl(AUTH_ROUTES.ssoCallback);
}

export function getOAuthCompleteUrl(): string {
  return getAuthRedirectUrl(AUTH_ROUTES.authComplete);
}

/** URL callback OAuth saat ini (harus match redirectUrl saat start OAuth) */
export function getCurrentOAuthCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return getOAuthCallbackUrl();
  }
  const { origin, pathname } = window.location;
  return `${origin}${pathname}`;
}

/** Query `redirect_url` dari halaman sign-in (mis. /dashboard) */
export function resolvePostAuthRedirect(): string {
  if (typeof window === 'undefined') {
    return AUTH_ROUTES.dashboard;
  }

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect_url');
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }

  return AUTH_ROUTES.dashboard;
}
