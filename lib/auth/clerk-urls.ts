import { AUTH_ROUTES } from './constants';
import { getAuthRedirectUrl } from './redirect-url';

/** URL absolut sign-in/sign-up untuk Clerk middleware (hindari accounts.dev) */
export function getClerkSignInUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.replace(/\/$/, '') ||
    getAuthRedirectUrl(AUTH_ROUTES.signIn)
  );
}

export function getClerkSignUpUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.replace(/\/$/, '') ||
    getAuthRedirectUrl(AUTH_ROUTES.signUp)
  );
}
