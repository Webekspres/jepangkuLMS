'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { FIXED_THEME, THEME_SWITCHING_ENABLED } from '@/lib/theme/theme-config';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={FIXED_THEME}
      forcedTheme={THEME_SWITCHING_ENABLED ? undefined : FIXED_THEME}
      enableSystem={THEME_SWITCHING_ENABLED}
      disableTransitionOnChange
      // React 19 warns on <script> in client components; theme still applies after hydration.
      scriptProps={{ type: 'application/json' }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
