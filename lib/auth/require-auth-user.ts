import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';

/** Clerk user id saja — tanpa hit DB (aman untuk halaman read / SSR). */
export const requireAuthUserId = cache(async function requireAuthUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return userId;
});

/** Auth + upsert baris User jangkar — wajib sebelum write yang butuh FK User. */
export const requireAuthUserWithAnchor = cache(async function requireAuthUserWithAnchor(): Promise<string> {
  const userId = await requireAuthUserId();
  await syncUserAnchor(userId);
  return userId;
});
