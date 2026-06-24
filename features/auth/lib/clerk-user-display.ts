/** Shape used from `useUser().user` — avoids direct @clerk/types dependency. */
type ClerkUserLike = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
  primaryEmailAddress?: { emailAddress: string } | null;
};

export type ClerkIdentity = {
  userId: string;
  displayName: string;
  email: string | null;
  imageUrl: string | null;
  initial: string;
};

/** Nama tampilan dari profil Clerk (Google SSO, email, dll.). */
export function resolveClerkIdentity(user: ClerkUserLike | null | undefined): ClerkIdentity | null {
  if (!user) return null;

  const displayName =
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Siswa JepangKu';

  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const imageUrl = user.imageUrl ?? null;
  const initial = displayName.charAt(0).toUpperCase();

  return { userId: user.id, displayName, email, imageUrl, initial };
}
