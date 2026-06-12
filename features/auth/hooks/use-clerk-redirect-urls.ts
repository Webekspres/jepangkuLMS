'use client';

import { useMemo } from 'react';
import {
  getClerkPostAuthRedirectUrl,
  getClerkSignInPageUrl,
  getClerkSignUpPageUrl,
} from '@/lib/auth/clerk-redirect-urls';

/** URL redirect Clerk absolut — recompute saat origin berubah (ngrok vs prod). */
export function useClerkRedirectUrls() {
  return useMemo(
    () => ({
      postAuth: getClerkPostAuthRedirectUrl(),
      signIn: getClerkSignInPageUrl(),
      signUp: getClerkSignUpPageUrl(),
    }),
    [],
  );
}
