'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { BADGE_IMAGE_MAX_BYTES, BADGE_IMAGE_MIME_TYPES } from '@/lib/media/constants';
import {
  saveBadgeToPublicDir,
} from '@/lib/media/local-badge-storage';
import { deleteFromR2, extractR2KeyFromUrl, isR2Configured, uploadToR2 } from '@/lib/r2';
import type { LmsBadgeUnlockRule, LevelJLPT } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { parseLmsBadgeRarity } from '@/lib/lms/badge-rarity';
import { grantBadgeToUser } from '@/lib/lms/badge-unlock';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { uuidSchema } from '@/lib/validations/shared';

export type CmsBadgeActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

/** Unlock rules exposed in CMS (retired rules remain in DB enum for compatibility). */
const CMS_UNLOCK_RULES = new Set([
  'FIRST_LESSON',
  'FIRST_LIVE_CLASS_JOIN',
  'TRYOUT_SCORE_THRESHOLD',
  'SPECIFIC_COURSE_COMPLETE',
  'SPECIFIC_MODULE_COMPLETE',
  'SPECIFIC_LESSON_COMPLETE',
]);

/** MANUAL stays valid on save for legacy badges that already use it. */
const CMS_UNLOCK_RULES_WITH_LEGACY = new Set([...CMS_UNLOCK_RULES, 'MANUAL']);

function slugifyCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function allocateUniqueBadgeCode(title: string): Promise<string> {
  const base = slugifyCode(title) || 'badge';
  let code = base;
  let n = 2;
  while (await prisma.lmsBadge.findUnique({ where: { code }, select: { id: true } })) {
    code = `${base}-${n}`;
    n += 1;
  }
  return code;
}

/** Next display order for new badges (append to end of list). */
async function nextBadgeSortOrder(): Promise<number> {
  const agg = await prisma.lmsBadge.aggregate({ _max: { sortOrder: true } });
  return (agg._max.sortOrder ?? 0) + 1;
}

function parseBadgeMeta(formData: FormData) {
  const unlockRuleRaw = String(formData.get('unlockRule') ?? 'FIRST_LESSON');
  const unlockRule = CMS_UNLOCK_RULES_WITH_LEGACY.has(unlockRuleRaw)
    ? unlockRuleRaw
    : 'FIRST_LESSON';
  const unlockValueRaw = String(formData.get('unlockValue') ?? '').trim();
  const unlockValue =
    unlockRule === 'TRYOUT_SCORE_THRESHOLD' && unlockValueRaw ? Number(unlockValueRaw) : null;
  const xpBonus = Number(formData.get('xpBonus') ?? 10) || 10;
  const requirementText = String(formData.get('requirementText') ?? '').trim() || null;
  const rarity = parseLmsBadgeRarity(String(formData.get('rarity') ?? 'COMMON'));

  const targetLevelRaw = String(formData.get('targetLevel') ?? '').trim();
  const targetLevel =
    unlockRule === 'TRYOUT_SCORE_THRESHOLD' && targetLevelRaw
      ? (targetLevelRaw as LevelJLPT)
      : null;

  const targetCourseIdRaw = String(formData.get('targetCourseId') ?? '').trim();
  const targetCourseId =
    (unlockRule === 'SPECIFIC_COURSE_COMPLETE' ||
      unlockRule === 'SPECIFIC_MODULE_COMPLETE' ||
      unlockRule === 'SPECIFIC_LESSON_COMPLETE') &&
    targetCourseIdRaw
      ? targetCourseIdRaw
      : null;

  const targetModuleIdRaw = String(formData.get('targetModuleId') ?? '').trim();
  const targetModuleId =
    (unlockRule === 'SPECIFIC_MODULE_COMPLETE' ||
      unlockRule === 'SPECIFIC_LESSON_COMPLETE') &&
    targetModuleIdRaw
      ? targetModuleIdRaw
      : null;

  const targetLessonIdRaw = String(formData.get('targetLessonId') ?? '').trim();
  const targetLessonId =
    unlockRule === 'SPECIFIC_LESSON_COMPLETE' && targetLessonIdRaw
      ? targetLessonIdRaw
      : null;

  return {
    unlockRule,
    unlockValue,
    xpBonus,
    requirementText,
    rarity,
    targetLevel,
    targetCategory: null as null,
    targetCourseId,
    targetModuleId,
    targetLessonId,
  };
}

async function validateBadgeTargets(meta: ReturnType<typeof parseBadgeMeta>): Promise<string | null> {
  if (meta.unlockRule === 'TRYOUT_SCORE_THRESHOLD') {
    if (meta.unlockValue === null || Number.isNaN(meta.unlockValue)) {
      return 'Nilai skor minimum wajib diisi.';
    }
    if (meta.unlockValue < 0 || meta.unlockValue > 100) {
      return 'Nilai skor harus di antara 0 dan 100.';
    }
  }

  if (meta.unlockRule === 'SPECIFIC_COURSE_COMPLETE' && !meta.targetCourseId) {
    return 'Target kursus wajib dipilih.';
  }

  if (meta.unlockRule === 'SPECIFIC_MODULE_COMPLETE') {
    if (!meta.targetCourseId) return 'Pilih kursus terlebih dahulu.';
    if (!meta.targetModuleId) return 'Target modul wajib dipilih.';

    const targetModule = await prisma.module.findUnique({
      where: { id: meta.targetModuleId },
      select: { courseId: true },
    });

    if (!targetModule) return 'Target modul tidak ditemukan.';
    if (targetModule.courseId !== meta.targetCourseId) {
      return 'Target modul harus berasal dari kursus yang dipilih.';
    }

    return null;
  }

  if (meta.unlockRule !== 'SPECIFIC_LESSON_COMPLETE') return null;

  if (!meta.targetCourseId) return 'Pilih kursus terlebih dahulu.';
  if (!meta.targetModuleId) return 'Pilih modul terlebih dahulu.';
  if (!meta.targetLessonId) return 'Target lesson wajib dipilih.';

  const lesson = await prisma.lesson.findUnique({
    where: { id: meta.targetLessonId },
    select: {
      moduleId: true,
      module: { select: { courseId: true } },
    },
  });

  if (!lesson) return 'Target lesson tidak ditemukan.';
  if (lesson.moduleId !== meta.targetModuleId) {
    return 'Target lesson harus berasal dari modul yang dipilih.';
  }
  if (lesson.module.courseId !== meta.targetCourseId) {
    return 'Target modul harus berasal dari kursus yang dipilih.';
  }

  return null;
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
  try {
    await requireAdminAction();

    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim() || null;
    const meta = parseBadgeMeta(formData);

    if (!title) return { ok: false, message: 'Judul badge wajib diisi.' };

    const targetError = await validateBadgeTargets(meta);
    if (targetError) return { ok: false, message: targetError };

    const code = await allocateUniqueBadgeCode(title);
    const sortOrder = await nextBadgeSortOrder();

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
        targetLevel: meta.targetLevel,
        targetCategory: null,
        targetCourseId: meta.targetCourseId,
        targetModuleId: meta.targetModuleId,
        targetLessonId: meta.targetLessonId,
      },
    });

    revalidatePath('/admin/badges');
    revalidatePath(STUDENT_ROUTES.achievements);
    return { ok: true, id: badge.id };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Gagal membuat badge. Coba lagi atau hubungi admin.',
    };
  }
}

export async function updateBadgeAction(id: string, formData: FormData): Promise<CmsBadgeActionResult> {
  try {
    await requireAdminAction();

    const badge = await prisma.lmsBadge.findUnique({ where: { id } });
    if (!badge) return { ok: false, message: 'Badge tidak ditemukan.' };

    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim() || null;
    const meta = parseBadgeMeta(formData);
    const removeImage = formData.get('removeImage') === 'true';

    if (!title) return { ok: false, message: 'Judul badge wajib diisi.' };

    const targetError = await validateBadgeTargets(meta);
    if (targetError) return { ok: false, message: targetError };

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
        imageUrl,
        rarity: meta.rarity,
        unlockRule: meta.unlockRule as LmsBadgeUnlockRule,
        unlockValue: meta.unlockValue,
        xpBonus: meta.xpBonus,
        requirementText: meta.requirementText,
        targetLevel: meta.targetLevel,
        targetCategory: null,
        targetCourseId: meta.targetCourseId,
        targetModuleId: meta.targetModuleId,
        targetLessonId: meta.targetLessonId,
      },
    });

    revalidatePath('/admin/badges');
    revalidatePath(STUDENT_ROUTES.achievements);
    return { ok: true, id };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Gagal memperbarui badge. Coba lagi atau hubungi admin.',
    };
  }
}

export async function deleteBadgeAction(id: string): Promise<CmsBadgeActionResult> {
  try {
    await requireAdminAction();

    const badge = await prisma.lmsBadge.findUnique({ where: { id } });
    if (!badge) return { ok: false, message: 'Badge tidak ditemukan.' };

    const key = extractR2KeyFromUrl(badge.imageUrl);
    if (key) await deleteFromR2(key).catch(() => undefined);

    await prisma.lmsBadge.delete({ where: { id } });

    revalidatePath('/admin/badges');
    revalidatePath(STUDENT_ROUTES.achievements);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Gagal menghapus badge. Coba lagi atau hubungi admin.',
    };
  }
}

const grantBadgeSchema = z.object({
  userId: z.string().trim().min(1, 'Siswa wajib dipilih'),
  badgeId: uuidSchema,
});

export async function grantBadgeAction(formData: FormData): Promise<CmsBadgeActionResult> {
  try {
    await requireAdminAction();

    const parsed = grantBadgeSchema.safeParse({
      userId: formData.get('userId'),
      badgeId: formData.get('badgeId'),
    });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return { ok: false, message: first ?? 'Data grant tidak valid.' };
    }

    const { userId, badgeId } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return { ok: false, message: 'Siswa tidak ditemukan.' };

    const badge = await prisma.lmsBadge.findUnique({
      where: { id: badgeId },
      select: { id: true },
    });
    if (!badge) return { ok: false, message: 'Badge tidak ditemukan.' };

    const result = await grantBadgeToUser(userId, badgeId);
    if (result === 'not_found') return { ok: false, message: 'Badge tidak ditemukan.' };
    if (result === 'already_owned') {
      return { ok: false, message: 'Siswa sudah memiliki badge ini.' };
    }

    revalidatePath(ADMIN_ROUTES.badges);
    revalidatePath(ADMIN_ROUTES.badgesGrant);
    revalidatePath(ADMIN_ROUTES.users);
    revalidatePath(ADMIN_ROUTES.userDetail(userId));
    revalidatePath(STUDENT_ROUTES.achievements);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Gagal memberikan badge. Coba lagi atau hubungi admin.',
    };
  }
}
