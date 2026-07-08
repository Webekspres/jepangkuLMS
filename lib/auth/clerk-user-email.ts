import { createClerkClient, type User } from '@clerk/nextjs/server';

export function resolveClerkPrimaryEmail(clerkUser: User): string | null {
  const primaryId = clerkUser.primaryEmailAddressId;
  if (primaryId) {
    const primary = clerkUser.emailAddresses.find((row) => row.id === primaryId);
    if (primary?.emailAddress) return primary.emailAddress;
  }
  return clerkUser.emailAddresses[0]?.emailAddress ?? null;
}

/** Ambil email utama user dari Clerk Backend API (admin / backfill). */
export async function fetchClerkPrimaryEmail(userId: string): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) return null;

  try {
    const clerk = createClerkClient({ secretKey });
    const clerkUser = await clerk.users.getUser(userId);
    return resolveClerkPrimaryEmail(clerkUser);
  } catch {
    return null;
  }
}
