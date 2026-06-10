'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { getClerkAppearance } from '@/features/auth/components/clerk-appearance';

function resolveIsDark(resolvedTheme: string | undefined): boolean {
  if (resolvedTheme === 'dark') return true;
  if (resolvedTheme === 'light') return false;
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
}

/**
 * Appearance Clerk yang re-compute saat tema berubah (next-themes).
 * Pakai bersama `key={appearanceKey}` pada SignIn/SignUp agar Clerk re-mount dengan tema baru.
 */
export function useClerkAppearance() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolveIsDark(resolvedTheme) : false;

  const appearance = useMemo(() => getClerkAppearance({ isDark }), [isDark]);

  const appearanceKey = mounted ? (isDark ? 'dark' : 'light') : 'pending';

  return { appearance, appearanceKey, mounted, isDark };
}
