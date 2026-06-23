const DISPLAY_NAME_FALLBACK = 'Siswa JepangKu';

export type DisplayNameSource = {
  displayName?: string | null;
  ssoDisplayName?: string | null;
  email?: string | null;
};

/** Nama publik LMS — prioritas displayName lokal, lalu SSO (Clerk), lalu email prefix. */
export function resolvePublicDisplayName(source: DisplayNameSource): string {
  const local = source.displayName?.trim();
  if (local) return local;

  const sso = source.ssoDisplayName?.trim();
  if (sso) return sso;

  const emailPrefix = source.email?.split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return DISPLAY_NAME_FALLBACK;
}

export function trimSsoDisplayName(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 64);
}
