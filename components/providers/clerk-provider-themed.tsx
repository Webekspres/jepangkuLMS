'use client';

import { useMemo } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { ui } from '@clerk/ui';
import { idID } from '@clerk/localizations';
import { useTheme } from 'next-themes';
import { getClerkAppearance } from '@/features/auth/components/clerk-appearance';
import { getClerkPostAuthRedirectUrl } from '@/lib/auth/clerk-redirect-urls';
import { getClerkSignInUrl, getClerkSignUpUrl } from '@/lib/auth/clerk-urls';

function resolveIsDark(resolvedTheme: string | undefined): boolean {
  if (resolvedTheme === 'dark') return true;
  if (resolvedTheme === 'light') return false;
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
}

/** ClerkProvider di dalam ThemeProvider — appearance ikut light/dark. */
export function ClerkProviderThemed({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolveIsDark(resolvedTheme);

  const appearance = useMemo(() => getClerkAppearance({ isDark }), [isDark]);

  return (
    <ClerkProvider
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
