'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { getClerkAppearance } from '@/features/auth/components/clerk-appearance';

/**
 * Appearance Clerk yang re-compute saat tema berubah (next-themes).
 * Pakai bersama `key={appearanceKey}` pada SignIn/SignUp agar Clerk re-mount dengan tema baru.
 */
export function useClerkAppearance() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const appearance = useMemo(() => getClerkAppearance({ isDark }), [isDark]);

  const appearanceKey = resolvedTheme ?? 'system';

  return { appearance, appearanceKey };
}
