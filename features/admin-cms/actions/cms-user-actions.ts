'use server';

import { revalidatePath } from 'next/cache';
import type { LmsRole } from '@prisma/client';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { searchAdminUsers, type AdminUserSearchResult } from '@/features/admin-cms/lib/search-admin-users';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { updateUserLmsRole } from '@/lib/lms/user-profile';
import { auth } from '@clerk/nextjs/server';

export type CmsUserActionResult =
  | { ok: true }
  | { ok: false; message: string };

export type SearchAdminUsersResult =
  | { ok: true; users: AdminUserSearchResult[] }
  | { ok: false; message: string };

export async function searchAdminUsersAction(query: string): Promise<SearchAdminUsersResult> {
  try {
    await requireAdminAction();
    const users = await searchAdminUsers(query);
    return { ok: true, users };
  } catch {
    return { ok: false, message: 'Gagal mencari pengguna.' };
  }
}

export async function updateUserRoleAction(
  targetUserId: string,
  role: LmsRole,
): Promise<CmsUserActionResult> {
  const adminId = await requireAdminAction();
  if (targetUserId === adminId && role !== 'LMS_ADMIN') {
    return { ok: false, message: 'Kamu tidak bisa menurunkan role admin milik sendiri.' };
  }

  try {
    await updateUserLmsRole(targetUserId, role);
    revalidatePath(ADMIN_ROUTES.users);
    revalidatePath(ADMIN_ROUTES.userDetail(targetUserId));
    return { ok: true };
  } catch {
    return { ok: false, message: 'Gagal memperbarui role pengguna.' };
  }
}

/** Promote current user to LMS_ADMIN (dev bootstrap — requires existing Core admin or dev bypass). */
export async function bootstrapSelfAdminAction(): Promise<CmsUserActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, message: 'Unauthorized' };

  try {
    await requireAdminAction();
    await updateUserLmsRole(userId, 'LMS_ADMIN');
    revalidatePath(ADMIN_ROUTES.users);
    revalidatePath(ADMIN_ROUTES.userDetail(userId));
    return { ok: true };
  } catch {
    return { ok: false, message: 'Forbidden' };
  }
}
