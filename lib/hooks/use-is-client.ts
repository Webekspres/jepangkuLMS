'use client';

import { useSyncExternalStore } from 'react';

/** Hydration-safe client detection without setState in effects. */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
