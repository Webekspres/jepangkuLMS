import { AUTH_ROUTES } from './constants';
import { getAppOrigin, getAuthRedirectUrl } from './redirect-url';

/** Satu callback OAuth untuk sign-in & sign-up — daftarkan URL ini di Clerk Dashboard */
export function getOAuthCallbackUrl(): string {
  return getAuthRedirectUrl(AUTH_ROUTES.ssoCallback);
}

export function getOAuthCompleteUrl(): string {
  return getAuthRedirectUrl(AUTH_ROUTES.dashboard);
}

/** URL callback OAuth saat ini (harus match redirectUrl saat start OAuth) */
export function getCurrentOAuthCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return getOAuthCallbackUrl();
  }
  const { origin, pathname } = window.location;
  return `${origin}${pathname}`;
}

const POST_AUTH_REDIRECT_STORAGE_KEY = 'jepangku_post_auth_redirect';

/**
 * Validasi path internal untuk post-login redirect (cegah open redirect).
 * Hanya `/dashboard…` dan `/admin…`; tolak protokol asing, `//…`, dan loop auth.
 */
export function sanitizeInternalRedirectPath(
  raw: string | null | undefined,
  origin: string = getAppOrigin(),
): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Relative path only — reject scheme / protocol-relative
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return null;
  if (trimmed.includes('\\')) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed, origin);
  } catch {
    return null;
  }

  if (parsed.origin !== new URL(origin).origin) return null;

  const candidate = `${parsed.pathname}${parsed.search}`;
  // Ensure we didn't accept a host-encoded trick; input must equal path(+search)
  if (candidate !== trimmed && parsed.pathname !== trimmed) return null;

  const { pathname } = parsed;
  if (
    pathname === AUTH_ROUTES.signIn ||
    pathname.startsWith(`${AUTH_ROUTES.signIn}/`) ||
    pathname === AUTH_ROUTES.signUp ||
    pathname.startsWith(`${AUTH_ROUTES.signUp}/`) ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/')
  ) {
    return null;
  }

  const allowed =
    pathname === AUTH_ROUTES.dashboard ||
    pathname.startsWith(`${AUTH_ROUTES.dashboard}/`) ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/');
  if (!allowed) return null;

  return candidate;
}

function readRedirectFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return sanitizeInternalRedirectPath(params.get('redirect_url'));
}

/** Persist intended URL so OAuth SSO callback (tanpa query) masih bisa kembali. */
export function persistPostAuthRedirect(path: string): void {
  if (typeof window === 'undefined') return;
  const safe = sanitizeInternalRedirectPath(path);
  if (!safe) return;
  try {
    sessionStorage.setItem(POST_AUTH_REDIRECT_STORAGE_KEY, safe);
  } catch {
    // private mode / quota — ignore
  }
}

/** Baca intended URL dari sessionStorage tanpa menghapus (aman untuk React Strict Mode). */
export function peekPostAuthRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sanitizeInternalRedirectPath(sessionStorage.getItem(POST_AUTH_REDIRECT_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Hapus intended URL dari sessionStorage. */
export function clearPostAuthRedirect(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Baca + hapus intended URL dari sessionStorage (SSO fallback). */
export function consumePostAuthRedirect(): string | null {
  const value = peekPostAuthRedirect();
  clearPostAuthRedirect();
  return value;
}

/**
 * Path post-login: `?redirect_url=` (aman) → dashboard.
 * Juga menyimpan path ke sessionStorage untuk flow OAuth.
 */
export function resolvePostAuthRedirect(): string {
  if (typeof window === 'undefined') {
    return AUTH_ROUTES.dashboard;
  }

  const fromQuery = readRedirectFromSearch(window.location.search);
  if (fromQuery) {
    persistPostAuthRedirect(fromQuery);
    return fromQuery;
  }

  return AUTH_ROUTES.dashboard;
}

/** Absolute URL untuk prop Clerk (fallbackRedirectUrl). */
export function resolvePostAuthRedirectAbsolute(): string {
  return getAuthRedirectUrl(resolvePostAuthRedirect());
}
