'use client';

import { useMemo } from 'react';
import { getClerkAppearance } from '@/features/auth/components/clerk-appearance';
import { useIsClient } from '@/lib/hooks/use-is-client';

/**
 * Clerk appearance — LMS is light-only.
 * Keep `appearanceKey` for SignIn/SignUp remount stability after hydration.
 */
export function useClerkAppearance() {
  const mounted = useIsClient();
  const appearance = useMemo(() => getClerkAppearance({ isDark: false }), []);
  const appearanceKey = mounted ? 'light' : 'pending';

  return { appearance, appearanceKey, mounted, isDark: false };
}
