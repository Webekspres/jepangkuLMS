'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { BADGE_IMAGE_MAX_BYTES, BADGE_IMAGE_MIME_TYPES } from '@/lib/media/constants';
import { deleteFromR2, extractR2KeyFromUrl, isR2Configured, uploadToR2 } from '@/lib/r2';
import type { LmsBadgeUnlockRule } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type CmsBadgeActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

function slugifyCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseBadgeMeta(formData: FormData) {
  const unlockRule = String(formData.get('unlockRule') ?? 'MANUAL');
  const unlockValueRaw = String(formData.get('unlockValue') ?? '').trim();
  const unlockValue = unlockValueRaw ? Number(unlockValueRaw) : null;
  const xpBonus = Number(formData.get('xpBonus') ?? 25) || 25;
  const requirementText = String(formData.get('requirementText') ?? '').trim() || null;
  return { unlockRule, unlockValue, xpBonus, requirementText };
}

async function parseBadgeImage(formData: FormData): Promise<{ buffer: Buffer; mime: string; ext: string } | null> {
  const file = formData.get('image');
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > BADGE_IMAGE_MAX_BYTES) {
    throw new Error('Ukuran gambar maksimal 2 MB.');
  }
  if (!BADGE_IMAGE_MIME_TYPES.includes(file.type as (typeof BADGE_IMAGE_MIME_TYPES)[number])) {
    throw new Error('Format gambar harus PNG, JPEG, atau WebP.');
  }
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, mime: file.type, ext };
}

export async function createBadgeAction(formData: FormData): Promise<CmsBadgeActionResult> {
  await requireAdminAction();

  const title = String(formData.get('title') ?? '').trim();
  const codeRaw = String(formData.get('code') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const sortOrder = Number(formData.get('sortOrder') ?? 0) || 0;
  const meta = parseBadgeMeta(formData);
  const code = slugifyCode(codeRaw || title);

  if (!title) return { ok: false, message: 'Judul badge wajib diisi.' };
  if (!code) return { ok: false, message: 'Kode badge tidak valid.' };

  const existing = await prisma.lmsBadge.findUnique({ where: { code } });
  if (existing) return { ok: false, message: `Kode "${code}" sudah dipakai.` };

  let imageUrl: string | null = null;
  const image = await parseBadgeImage(formData);
  if (image) {
    if (!isR2Configured()) {
      return {
        ok: false,
        message:
          'R2 belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL di .env.',
      };
    }
    const key = `badges/${code}-${Date.now()}.${image.ext}`;
    imageUrl = await uploadToR2(image.buffer, key, image.mime);
  }

  const badge = await prisma.lmsBadge.create({
    data: {
      code,
      title,
      description,
      imageUrl,
      sortOrder,
      unlockRule: meta.unlockRule as LmsBadgeUnlockRule,
      unlockValue: meta.unlockValue,
      xpBonus: meta.xpBonus,
      requirementText: meta.requirementText,
    },
  });

  revalidatePath('/admin/badges');
  revalidatePath('/dashboard/pencapaian');
  return { ok: true, id: badge.id };
}

export async function updateBadgeAction(id: string, formData: FormData): Promise<CmsBadgeActionResult> {
  await requireAdminAction();

  const badge = await prisma.lmsBadge.findUnique({ where: { id } });
  if (!badge) return { ok: false, message: 'Badge tidak ditemukan.' };

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const sortOrder = Number(formData.get('sortOrder') ?? badge.sortOrder) || 0;
  const meta = parseBadgeMeta(formData);
  const removeImage = formData.get('removeImage') === 'true';

  if (!title) return { ok: false, message: 'Judul badge wajib diisi.' };

  let imageUrl = badge.imageUrl;

  if (removeImage && imageUrl) {
    const key = extractR2KeyFromUrl(imageUrl);
    if (key) await deleteFromR2(key).catch(() => undefined);
    imageUrl = null;
  }

  const image = await parseBadgeImage(formData);
  if (image) {
    if (!isR2Configured()) {
      return {
        ok: false,
        message:
          'R2 belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL di .env.',
      };
    }
    const oldKey = extractR2KeyFromUrl(badge.imageUrl);
    if (oldKey) await deleteFromR2(oldKey).catch(() => undefined);
    const key = `badges/${badge.code}-${Date.now()}.${image.ext}`;
    imageUrl = await uploadToR2(image.buffer, key, image.mime);
  }

  await prisma.lmsBadge.update({
    where: { id },
    data: {
      title,
      description,
      sortOrder,
      imageUrl,
      unlockRule: meta.unlockRule as LmsBadgeUnlockRule,
      unlockValue: meta.unlockValue,
      xpBonus: meta.xpBonus,
      requirementText: meta.requirementText,
    },
  });

  revalidatePath('/admin/badges');
  revalidatePath('/dashboard/pencapaian');
  return { ok: true, id };
}

export async function deleteBadgeAction(id: string): Promise<CmsBadgeActionResult> {
  await requireAdminAction();

  const badge = await prisma.lmsBadge.findUnique({ where: { id } });
  if (!badge) return { ok: false, message: 'Badge tidak ditemukan.' };

  const key = extractR2KeyFromUrl(badge.imageUrl);
  if (key) await deleteFromR2(key).catch(() => undefined);

  await prisma.lmsBadge.delete({ where: { id } });

  revalidatePath('/admin/badges');
  revalidatePath('/dashboard/pencapaian');
  return { ok: true };
}
