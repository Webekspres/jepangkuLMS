import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';

/** Pastikan user terautentikasi sebelum mutasi CMS — gate `/admin` di proxy. */
export async function requireAdminAction(): Promise<string> {
  return requireAuthUserWithAnchor();
}
