export const LMS_ADMIN_ROLES = ['LMS_ADMIN', 'CORE_ADMIN'] as const;

/** Role siswa LMS — Core v2.1+ memakai SISWA; STUDENT untuk kompatibilitas lama. */
export const LMS_STUDENT_ROLES = ['SISWA', 'STUDENT'] as const;

export function hasLmsAdminAccess(roles: string[]): boolean {
  return roles.some((r) => (LMS_ADMIN_ROLES as readonly string[]).includes(r));
}

/** Local dev only — never set in production. See .env.example LMS_DEV_ADMIN_BYPASS. */
export function isDevAdminBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.LMS_DEV_ADMIN_BYPASS === 'true'
  );
}

/** Gate `/admin/*` — Core admin role atau dev bypass. */
export function canAccessLmsAdminPanel(roles: string[] = []): boolean {
  if (isDevAdminBypassEnabled()) return true;
  return hasLmsAdminAccess(roles);
}
