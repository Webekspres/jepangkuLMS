'use client';

import { AppSplash } from '@/components/app-splash';
import QueryProvider from '@/components/providers/query-provider';

/**
 * Bundel provider client global (Query, Clerk, dll.).
 * Tambahkan provider baru di sini agar root layout tetap Server Component.
 */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppSplash>{children}</AppSplash>
    </QueryProvider>
  );
}
