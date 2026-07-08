export const GENERIC_LMS_DISPLAY_NAME = 'Siswa JepangKu';

export type DisplayNameSource = {
  displayName?: string | null;
  ssoDisplayName?: string | null;
  email?: string | null;
};

/** Placeholder LMS — bukan identitas unik; jangan diprioritaskan di atas SSO. */
export function isGenericLmsDisplayName(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, ' ');
  return normalized === 'siswa jepangku';
}

function effectiveLocalDisplayName(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || isGenericLmsDisplayName(trimmed)) return null;
  return trimmed;
}

/** Nama publik LMS — prioritas displayName lokal (bukan placeholder), lalu SSO (Clerk), lalu email prefix. */
export function resolvePublicDisplayName(source: DisplayNameSource): string {
  const local = effectiveLocalDisplayName(source.displayName);
  if (local) return local;

  const sso = source.ssoDisplayName?.trim();
  if (sso) return sso;

  const emailPrefix = source.email?.split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return GENERIC_LMS_DISPLAY_NAME;
}

export function trimSsoDisplayName(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 64);
}
