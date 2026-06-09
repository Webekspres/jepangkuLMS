import type { UserResource } from '@clerk/types';

export type ClerkIdentity = {
  userId: string;
  displayName: string;
  email: string | null;
  imageUrl: string | null;
  initial: string;
};

/** Nama tampilan dari profil Clerk (Google SSO, email, dll.). */
export function resolveClerkIdentity(user: UserResource | null | undefined): ClerkIdentity | null {
  if (!user) return null;

  const displayName =
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Pengguna';

  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const imageUrl = user.imageUrl ?? null;
  const initial = displayName.charAt(0).toUpperCase();

  return { userId: user.id, displayName, email, imageUrl, initial };
}
