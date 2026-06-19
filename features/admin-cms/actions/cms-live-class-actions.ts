'use server';

import { revalidatePath } from 'next/cache';
import type { LevelJLPT } from '@prisma/client';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';

export type CmsLiveClassActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

const JLPT_LEVELS: LevelJLPT[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

function parseLiveClassForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const senseiName = String(formData.get('senseiName') ?? '').trim();
  const senseiLevel = String(formData.get('senseiLevel') ?? '').trim() || null;
  const category = String(formData.get('category') ?? '').trim();
  const level = String(formData.get('level') ?? 'N5') as LevelJLPT;
  const scheduledAtRaw = String(formData.get('scheduledAt') ?? '').trim();
  const endsAtRaw = String(formData.get('endsAt') ?? '').trim();
  const maxSlots = Number(formData.get('maxSlots') ?? 30) || 30;
  const filledSlots = Number(formData.get('filledSlots') ?? 0) || 0;
  const thumbUrl = String(formData.get('thumbUrl') ?? '').trim() || null;
  const meetingUrl = String(formData.get('meetingUrl') ?? '').trim() || null;
  const isPublished = formData.get('isPublished') === 'on';

  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;

  return {
    title,
    description,
    senseiName,
    senseiLevel,
    category,
    level,
    scheduledAt,
    endsAt,
    maxSlots,
    filledSlots,
    thumbUrl,
    meetingUrl,
    isPublished,
  };
}

function validateLiveClass(data: ReturnType<typeof parseLiveClassForm>): string | null {
  if (!data.title) return 'Judul kelas wajib diisi.';
  if (!data.description) return 'Deskripsi wajib diisi.';
  if (!data.senseiName) return 'Nama sensei wajib diisi.';
  if (!data.category) return 'Kategori wajib diisi.';
  if (!JLPT_LEVELS.includes(data.level)) return 'Level JLPT tidak valid.';
  if (!data.scheduledAt || Number.isNaN(data.scheduledAt.getTime())) {
    return 'Jadwal mulai wajib diisi.';
  }
  if (data.maxSlots < 1) return 'Kapasitas minimal 1.';
  if (data.filledSlots < 0 || data.filledSlots > data.maxSlots) {
    return 'Jumlah peserta tidak valid.';
  }
  return null;
}

export async function createLiveClassAction(formData: FormData): Promise<CmsLiveClassActionResult> {
  await requireAdminAction();
  const data = parseLiveClassForm(formData);
  const error = validateLiveClass(data);
  if (error) return { ok: false, message: error };

  const row = await prisma.liveClass.create({
    data: {
      title: data.title,
      description: data.description,
      senseiName: data.senseiName,
      senseiLevel: data.senseiLevel,
      category: data.category,
      level: data.level,
      scheduledAt: data.scheduledAt!,
      endsAt: data.endsAt,
      maxSlots: data.maxSlots,
      filledSlots: data.filledSlots,
      thumbUrl: data.thumbUrl,
      meetingUrl: data.meetingUrl,
      isPublished: data.isPublished,
    },
  });

  revalidatePath(ADMIN_ROUTES.liveClass);
  revalidatePath('/dashboard/live-class');
  return { ok: true, id: row.id };
}

export async function updateLiveClassAction(
  id: string,
  formData: FormData,
): Promise<CmsLiveClassActionResult> {
  await requireAdminAction();
  const existing = await prisma.liveClass.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: 'Live class tidak ditemukan.' };

  const data = parseLiveClassForm(formData);
  const error = validateLiveClass(data);
  if (error) return { ok: false, message: error };

  await prisma.liveClass.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      senseiName: data.senseiName,
      senseiLevel: data.senseiLevel,
      category: data.category,
      level: data.level,
      scheduledAt: data.scheduledAt!,
      endsAt: data.endsAt,
      maxSlots: data.maxSlots,
      filledSlots: data.filledSlots,
      thumbUrl: data.thumbUrl,
      meetingUrl: data.meetingUrl,
      isPublished: data.isPublished,
    },
  });

  revalidatePath(ADMIN_ROUTES.liveClass);
  revalidatePath('/dashboard/live-class');
  return { ok: true, id };
}

export async function deleteLiveClassAction(id: string): Promise<CmsLiveClassActionResult> {
  await requireAdminAction();
  await prisma.liveClass.delete({ where: { id } });
  revalidatePath(ADMIN_ROUTES.liveClass);
  revalidatePath('/dashboard/live-class');
  return { ok: true };
}

export async function toggleLiveClassPublishedAction(
  id: string,
  isPublished: boolean,
): Promise<CmsLiveClassActionResult> {
  await requireAdminAction();
  await prisma.liveClass.update({ where: { id }, data: { isPublished } });
  revalidatePath(ADMIN_ROUTES.liveClass);
  revalidatePath('/dashboard/live-class');
  return { ok: true };
}
