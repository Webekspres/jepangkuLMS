import { auth } from '@clerk/nextjs/server';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { userHasLmsAdminAccess } from '@/lib/auth/resolve-lms-admin';
import { getCoreSession } from '@/lib/core/get-core-session';

/** Pastikan user terautentikasi + admin sebelum mutasi CMS. */
export async function requireAdminAction(): Promise<string> {
  const userId = await requireAuthUserWithAnchor();
  const session = await getCoreSession();
  const allowed = await userHasLmsAdminAccess(userId, session?.roles ?? []);
  if (!allowed) {
    throw new Error('Forbidden — akses admin diperlukan.');
  }
  return userId;
}

/** Gate server layout/actions — verifikasi admin tanpa write. */
export async function requireAdminAccess(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const session = await getCoreSession();
  const allowed = await userHasLmsAdminAccess(userId, session?.roles ?? []);
  if (!allowed) throw new Error('Forbidden');
  return userId;
}
