'use client';

import { AppSplash } from '@/components/app-splash';
import { ClerkProviderThemed } from '@/components/providers/clerk-provider-themed';
import QueryProvider from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';

/**
 * Bundel provider client global (Query, Clerk, dll.).
 * ThemeProvider di luar Clerk agar appearance Clerk ikut light/dark.
 */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClerkProviderThemed>
        <QueryProvider>
          <AppSplash>{children}</AppSplash>
        </QueryProvider>
      </ClerkProviderThemed>
    </ThemeProvider>
  );
}
