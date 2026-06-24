import { prisma } from '@/lib/prisma';
import {
  canAccessLmsAdminPanel,
  DEFAULT_LMS_ROLE,
  hasLmsAdminAccess,
} from '@/lib/auth/lms-roles';
import type { LmsRole } from '@prisma/client';

/** Admin gate: Core JWT roles, LMS DB role, atau dev bypass. */
export async function userHasLmsAdminAccess(
  userId: string | null | undefined,
  coreRoles: string[] = [],
): Promise<boolean> {
  if (canAccessLmsAdminPanel(coreRoles)) return true;
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'LMS_ADMIN';
}

export function isCoreOrLocalAdmin(coreRoles: string[]): boolean {
  return hasLmsAdminAccess(coreRoles);
}

export async function getUserLmsRole(userId: string): Promise<LmsRole> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? DEFAULT_LMS_ROLE;
}
