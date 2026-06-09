'use client';

import { useUser } from '@clerk/nextjs';
import { resolveClerkIdentity, type ClerkIdentity } from '@/features/auth/lib/clerk-user-display';

export function useClerkIdentity(): {
  identity: ClerkIdentity | null;
  isLoaded: boolean;
  isSignedIn: boolean;
} {
  const { user, isLoaded, isSignedIn } = useUser();

  return {
    identity: resolveClerkIdentity(user),
    isLoaded,
    isSignedIn: isSignedIn ?? false,
  };
}
