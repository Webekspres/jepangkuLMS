'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      // React 19 warns on <script> in client components; theme still applies after hydration.
      scriptProps={{ type: 'application/json' }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
