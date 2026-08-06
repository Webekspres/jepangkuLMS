'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
  getClerkPostAuthRedirectUrl,
  getClerkSignInPageUrl,
  getClerkSignUpPageUrl,
} from '@/lib/auth/clerk-redirect-urls';
import { resolvePostAuthRedirectAbsolute } from '@/lib/auth/oauth-urls';

function subscribeNoop() {
  return () => {};
}

/** Client-only flag without setState-in-effect (SSR-safe). */
function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

/** URL redirect Clerk absolut — intended URL dari `?redirect_url=` (client). */
export function useClerkRedirectUrls() {
  const ready = useIsClient();

  const postAuth = useMemo(
    () => (ready ? resolvePostAuthRedirectAbsolute() : getClerkPostAuthRedirectUrl()),
    [ready],
  );

  const signIn = useMemo(() => getClerkSignInPageUrl(), []);
  const signUp = useMemo(() => getClerkSignUpPageUrl(), []);

  return { postAuth, ready, signIn, signUp };
}
