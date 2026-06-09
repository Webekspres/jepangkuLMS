/**
 * Clerk OAuth redirectUrl wajib URL absolut ke domain app (localhost / ngrok / prod).
 * Path relatif saja → Clerk fallback ke hosted Account Portal (accounts.dev).
 */
export function getAppOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  return configured ?? 'http://localhost:3000';
}

export function getAuthRedirectUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getAppOrigin()}${normalized}`;
}
