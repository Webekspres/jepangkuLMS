import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';

/** Satu auth + user anchor per request — hindari upsert ganda antar loader. */
export const requireAuthUserId = cache(async function requireAuthUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  await syncUserAnchor(userId);
  return userId;
});
