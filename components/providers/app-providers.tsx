'use client';

import '@/lib/vidstack/suppress-provider-destroyed-rejection';

import { AppSplash } from '@/components/app-splash';
import { AppTopLoader } from '@/components/providers/app-top-loader';
import { ClerkProviderThemed } from '@/components/providers/clerk-provider-themed';
import QueryProvider from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CoreSessionSync } from '@/features/auth/components/core-session-sync';

/**
 * Bundel provider client global (Query, Clerk, dll.).
 * ThemeProvider di luar Clerk agar appearance Clerk ikut light/dark.
 */
export default function AppProviders({
  children,
  clerkPublishableKey,
}: {
  children: React.ReactNode;
  clerkPublishableKey: string;
}) {
  return (
    <ThemeProvider>
      <AppTopLoader />
      <ClerkProviderThemed publishableKey={clerkPublishableKey}>
        <QueryProvider>
          <TooltipProvider delayDuration={0}>
            <AppSplash>
              <CoreSessionSync />
              {children}
            </AppSplash>
            <Toaster richColors closeButton position="top-right" />
          </TooltipProvider>
        </QueryProvider>
      </ClerkProviderThemed>
    </ThemeProvider>
  );
}
