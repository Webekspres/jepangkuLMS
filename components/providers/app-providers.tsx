'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ui } from '@clerk/ui';
import { AppSplash } from '@/components/app-splash';
import QueryProvider from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { getClerkAppearance } from '@/features/auth/components/clerk-appearance';
import { getClerkPostAuthRedirectUrl } from '@/lib/auth/clerk-redirect-urls';
import { getClerkSignInUrl, getClerkSignUpUrl } from '@/lib/auth/clerk-urls';

/**
 * Bundel provider client global (Query, Clerk, dll.).
 * Tambahkan provider baru di sini agar root layout tetap Server Component.
 */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      ui={ui}
      signInUrl={getClerkSignInUrl()}
      signUpUrl={getClerkSignUpUrl()}
      signInFallbackRedirectUrl={getClerkPostAuthRedirectUrl()}
      signUpFallbackRedirectUrl={getClerkPostAuthRedirectUrl()}
      signInForceRedirectUrl={getClerkPostAuthRedirectUrl()}
      signUpForceRedirectUrl={getClerkPostAuthRedirectUrl()}
      appearance={getClerkAppearance()}
    >
      <ThemeProvider>
        <QueryProvider>
          <AppSplash>{children}</AppSplash>
        </QueryProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
