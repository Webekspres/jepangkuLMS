import { AUTH_ROUTES } from './constants';
import { getAuthRedirectUrl } from './redirect-url';

/**
 * URL absolut untuk redirect Clerk setelah login/OAuth.
 * Core JWT exchange berjalan di background (CoreSessionSync / StudentCoreDataHydrator).
 */
export function getClerkPostAuthRedirectUrl(): string {
  return getAuthRedirectUrl(AUTH_ROUTES.dashboard);
}

export function getClerkSignInPageUrl(): string {
  return getAuthRedirectUrl(AUTH_ROUTES.signIn);
}

export function getClerkSignUpPageUrl(): string {
  return getAuthRedirectUrl(AUTH_ROUTES.signUp);
}
