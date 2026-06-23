'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAuthUserWithAnchor } from '@/lib/auth/require-auth-user';
import { clearEquippedBadge, equipLmsBadge } from '@/lib/lms/badges';
import { updateLmsAvatarFromUpload, updateLmsBio, updateLmsDisplayName } from '@/lib/lms/user-profile';

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
    revalidatePath('/dashboard/profil/edit');
    revalidatePath('/dashboard/leaderboard');
    revalidatePath('/dashboard/pencapaian');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan nama tampilan.';
    return { ok: false, error: message };
  }
}

const bioSchema = z.string().max(280, 'Bio maksimal 280 karakter.');

export async function updateStudentBio(
  bio: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthUserWithAnchor();
    const parsed = bioSchema.safeParse(bio);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Bio tidak valid.' };
    }
    await updateLmsBio(userId, parsed.data);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profil');
    revalidatePath('/dashboard/profil/edit');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan bio.';
    return { ok: false, error: message };
  }
}

export async function updateStudentAvatar(
  formData: FormData,
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthUserWithAnchor();
    const file = formData.get('avatar');
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: 'Pilih file foto terlebih dahulu.' };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const avatarUrl = await updateLmsAvatarFromUpload(userId, buffer, file.type);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profil');
    revalidatePath('/dashboard/profil/edit');
    revalidatePath('/dashboard/leaderboard');
    return { ok: true, avatarUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengunggah foto profil.';
    return { ok: false, error: message };
  }
}

export async function equipStudentBadge(
  badgeId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthUserWithAnchor();
    const success = await equipLmsBadge(userId, badgeId);
    if (!success) {
      return { ok: false, error: 'Badge belum di-unlock atau tidak ditemukan.' };
    }
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profil');
    revalidatePath('/dashboard/pencapaian');
    revalidatePath('/dashboard/leaderboard');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memasang badge.';
    return { ok: false, error: message };
  }
}

export async function unequipStudentBadge(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireAuthUserWithAnchor();
    await clearEquippedBadge(userId);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profil');
    revalidatePath('/dashboard/pencapaian');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal melepas badge.';
    return { ok: false, error: message };
  }
}
