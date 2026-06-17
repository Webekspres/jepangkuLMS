import { prisma } from '@/lib/prisma';

const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 32;
const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u;

export function validateLmsDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < DISPLAY_NAME_MIN || trimmed.length > DISPLAY_NAME_MAX) {
    return `Nama tampilan harus ${DISPLAY_NAME_MIN}–${DISPLAY_NAME_MAX} karakter.`;
  }
  if (!DISPLAY_NAME_PATTERN.test(trimmed)) {
    return 'Nama hanya boleh huruf, angka, spasi, titik, strip, dan underscore.';
  }
  return null;
}

/** Nama tampilan LMS — prioritas DB lokal, fallback Clerk/Core. */
export async function resolveLmsDisplayName(
  userId: string,
  fallback?: string | null,
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  });
  const local = user?.displayName?.trim();
  if (local) return local;
  const fb = fallback?.trim();
  return fb || null;
}

export async function updateLmsDisplayName(userId: string, displayName: string): Promise<void> {
  const error = validateLmsDisplayName(displayName);
  if (error) throw new Error(error);

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, displayName: displayName.trim() },
    update: { displayName: displayName.trim() },
  });
}
