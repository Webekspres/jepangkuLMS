'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { BADGE_IMAGE_MAX_BYTES, BADGE_IMAGE_MIME_TYPES } from '@/lib/media/constants';
import {
  parseStaticImageUrl,
  saveBadgeToPublicDir,
} from '@/lib/media/local-badge-storage';
import { deleteFromR2, extractR2KeyFromUrl, isR2Configured, uploadToR2 } from '@/lib/r2';
import type { LmsBadgeUnlockRule } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { parseLmsBadgeRarity } from '@/lib/lms/badge-rarity';

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
  const rarity = parseLmsBadgeRarity(String(formData.get('rarity') ?? 'COMMON'));
  return { unlockRule, unlockValue, xpBonus, requirementText, rarity };
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

async function resolveBadgeImageUrl(
  code: string,
  formData: FormData,
  existingUrl: string | null = null,
): Promise<string | null> {
  const staticUrl = parseStaticImageUrl(String(formData.get('imageUrl') ?? ''));
  if (staticUrl) return staticUrl;

  const image = await parseBadgeImage(formData);
  if (!image) return existingUrl;

  if (isR2Configured()) {
    try {
      const key = `badges/${code}-${Date.now()}.${image.ext}`;
      return await uploadToR2(image.buffer, key, image.mime);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('Access Denied') && !message.includes('belum dikonfigurasi')) {
        throw error;
      }
      // Fallback ke public/badges untuk dev lokal atau VPS tanpa R2 write
    }
  }

  return saveBadgeToPublicDir(code, image.buffer, image.ext);
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
  try {
    imageUrl = await resolveBadgeImageUrl(code, formData);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Gagal menyimpan gambar badge.',
    };
  }

  const badge = await prisma.lmsBadge.create({
    data: {
      code,
      title,
      description,
      imageUrl,
      sortOrder,
      rarity: meta.rarity,
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

  try {
    const resolved = await resolveBadgeImageUrl(badge.code, formData, imageUrl);
    if (resolved !== imageUrl) {
      const oldKey = extractR2KeyFromUrl(badge.imageUrl);
      if (oldKey) await deleteFromR2(oldKey).catch(() => undefined);
      imageUrl = resolved;
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Gagal menyimpan gambar badge.',
    };
  }

  await prisma.lmsBadge.update({
    where: { id },
    data: {
      title,
      description,
      sortOrder,
      imageUrl,
      rarity: meta.rarity,
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
