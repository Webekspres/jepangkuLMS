'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { AppSplash } from '@/components/app-splash';
import QueryProvider from '@/components/providers/query-provider';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { getClerkSignInUrl, getClerkSignUpUrl } from '@/lib/auth/clerk-urls';

/**
 * Bundel provider client global (Query, Clerk, dll.).
 * Tambahkan provider baru di sini agar root layout tetap Server Component.
 */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl={getClerkSignInUrl()}
      signUpUrl={getClerkSignUpUrl()}
      signInFallbackRedirectUrl={AUTH_ROUTES.dashboard}
      signUpFallbackRedirectUrl={AUTH_ROUTES.dashboard}
    >
      <QueryProvider>
        <AppSplash>{children}</AppSplash>
      </QueryProvider>
    </ClerkProvider>
  );
}
