import { AUTH_ROUTES } from '@/lib/auth/constants';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { getAuthRedirectUrl } from '@/lib/auth/redirect-url';

/**
 * URL absolut untuk redirect Clerk setelah login/OAuth.
 * Core off → langsung dashboard; Core on → /auth/complete (exchange JWT).
 */
export function getClerkPostAuthRedirectUrl(): string {
  const path = isCoreIntegrationEnabled() ? AUTH_ROUTES.authComplete : AUTH_ROUTES.dashboard;
  return getAuthRedirectUrl(path);
}

export function getClerkSignInPageUrl(): string {
  return getAuthRedirectUrl(AUTH_ROUTES.signIn);
}

export function getClerkSignUpPageUrl(): string {
  return getAuthRedirectUrl(AUTH_ROUTES.signUp);
}
