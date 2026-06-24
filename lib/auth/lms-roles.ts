export const LMS_ADMIN_ROLES = ['LMS_ADMIN', 'CORE_ADMIN'] as const;

/** Role siswa LMS — Core v2.1+ memakai SISWA; STUDENT untuk kompatibilitas lama. */
export const LMS_STUDENT_ROLES = ['SISWA', 'STUDENT'] as const;

/** Default role lokal setiap user baru — tidak pernah null/kosong. */
export const DEFAULT_LMS_ROLE = 'LMS_STUDENT' as const;

export type LmsLocalRole = typeof DEFAULT_LMS_ROLE | 'LMS_ADMIN';

/** Clerk user id yang otomatis jadi admin LMS saat pertama kali terdaftar (staging/prod). */
export function getBootstrapAdminUserId(): string | null {
  const id = process.env.LMS_BOOTSTRAP_ADMIN_USER_ID?.trim();
  return id || null;
}

export function isBootstrapAdminUser(userId: string): boolean {
  const bootstrapId = getBootstrapAdminUserId();
  return Boolean(bootstrapId && bootstrapId === userId);
}

/** Role awal saat baris User jangkar dibuat — siswa default, kecuali bootstrap admin. */
export function resolveInitialLmsRole(userId: string): LmsLocalRole {
  return isBootstrapAdminUser(userId) ? 'LMS_ADMIN' : DEFAULT_LMS_ROLE;
}

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
