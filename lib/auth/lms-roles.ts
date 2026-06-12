export const LMS_ADMIN_ROLES = ['LMS_ADMIN', 'CORE_ADMIN'] as const;

export function hasLmsAdminAccess(roles: string[]): boolean {
  return roles.some((r) => (LMS_ADMIN_ROLES as readonly string[]).includes(r));
}
