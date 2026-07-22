'use client';

import { useMemo } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { ui } from '@clerk/ui';
import { idID } from '@clerk/localizations';
import { getClerkAppearance } from '@/features/auth/components/clerk-appearance';
import { getClerkPostAuthRedirectUrl } from '@/lib/auth/clerk-redirect-urls';
import { getClerkSignInUrl, getClerkSignUpUrl } from '@/lib/auth/clerk-urls';

/** ClerkProvider with fixed light appearance (LMS is light-only). */
export function ClerkProviderThemed({
  children,
  publishableKey,
}: {
  children: React.ReactNode;
  publishableKey: string;
}) {
  const appearance = useMemo(() => getClerkAppearance({ isDark: false }), []);

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={idID}
      ui={ui}
      signInUrl={getClerkSignInUrl()}
      signUpUrl={getClerkSignUpUrl()}
      signInFallbackRedirectUrl={getClerkPostAuthRedirectUrl()}
      signUpFallbackRedirectUrl={getClerkPostAuthRedirectUrl()}
      signInForceRedirectUrl={getClerkPostAuthRedirectUrl()}
      signUpForceRedirectUrl={getClerkPostAuthRedirectUrl()}
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  );
}
