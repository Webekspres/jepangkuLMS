'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { updateLmsDisplayName } from '@/lib/lms/user-profile';

const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Nama tampilan minimal 2 karakter.')
  .max(32, 'Nama tampilan maksimal 32 karakter.');

export async function updateStudentDisplayName(
  displayName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthUserWithAnchor();
    const parsed = displayNameSchema.safeParse(displayName);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nama tidak valid.' };
    }
    await updateLmsDisplayName(userId, parsed.data);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profil');
    revalidatePath('/dashboard/leaderboard');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan nama tampilan.';
    return { ok: false, error: message };
  }
}
