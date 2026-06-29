'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/string-helpers';

export type CmsTryoutActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

function parseTryoutForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const codeRaw = String(formData.get('code') ?? '').trim();
  const phaseLabel = String(formData.get('phaseLabel') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const scheduledAtRaw = String(formData.get('scheduledAt') ?? '').trim();
  const timeLimitMinutes = Number(formData.get('timeLimitMinutes') ?? 120) || 120;
  const sortOrder = Number(formData.get('sortOrder') ?? 0) || 0;
  const isActive = formData.get('isActive') === 'on';
  const isStrictTimeBound = formData.get('isStrictTimeBound') === 'on';
  const priceIdr = Math.max(0, Math.trunc(Number(formData.get('priceIdr') ?? 0) || 0));
  const code = generateSlug(codeRaw || title);
  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;

  return {
    title,
    code,
    phaseLabel,
    description,
    scheduledAt,
    timeLimitMinutes,
    sortOrder,
    isActive,
    isStrictTimeBound,
    priceIdr,
  };
}

function validateTryout(data: ReturnType<typeof parseTryoutForm>): string | null {
  if (!data.title) return 'Judul sesi wajib diisi.';
  if (!data.code) return 'Kode sesi tidak valid.';
  if (!data.phaseLabel) return 'Label fase wajib diisi.';
  if (data.timeLimitMinutes < 10) return 'Durasi minimal 10 menit.';
  return null;
}

export async function createTryoutSessionAction(formData: FormData): Promise<CmsTryoutActionResult> {
  await requireAdminAction();
  const data = parseTryoutForm(formData);
  const error = validateTryout(data);
  if (error) return { ok: false, message: error };

  const existing = await prisma.tryoutSession.findUnique({ where: { code: data.code } });
  if (existing) return { ok: false, message: `Kode "${data.code}" sudah dipakai.` };

  const row = await prisma.tryoutSession.create({
    data: {
      code: data.code,
      title: data.title,
      phaseLabel: data.phaseLabel,
      description: data.description,
      scheduledAt: data.scheduledAt,
      timeLimitMinutes: data.timeLimitMinutes,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      isStrictTimeBound: data.isStrictTimeBound,
      priceIdr: data.priceIdr,
    },
  });

  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath('/dashboard/tryout');
  return { ok: true, id: row.id };
}

export async function updateTryoutSessionAction(
  id: string,
  formData: FormData,
): Promise<CmsTryoutActionResult> {
  await requireAdminAction();
  const existing = await prisma.tryoutSession.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: 'Sesi tryout tidak ditemukan.' };

  const data = parseTryoutForm(formData);
  const error = validateTryout(data);
  if (error) return { ok: false, message: error };

  if (data.code !== existing.code) {
    const duplicate = await prisma.tryoutSession.findUnique({ where: { code: data.code } });
    if (duplicate) return { ok: false, message: `Kode "${data.code}" sudah dipakai.` };
  }

  await prisma.tryoutSession.update({
    where: { id },
    data: {
      code: data.code,
      title: data.title,
      phaseLabel: data.phaseLabel,
      description: data.description,
      scheduledAt: data.scheduledAt,
      timeLimitMinutes: data.timeLimitMinutes,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      isStrictTimeBound: data.isStrictTimeBound,
      priceIdr: data.priceIdr,
    },
  });

  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath('/dashboard/tryout');
  return { ok: true, id };
}

export async function deleteTryoutSessionAction(id: string): Promise<CmsTryoutActionResult> {
  await requireAdminAction();
  const questionCount = await prisma.question.count({ where: { tryoutSessionId: id } });
  if (questionCount > 0) {
    return {
      ok: false,
      message: `Sesi masih memiliki ${questionCount} soal. Hapus atau pindahkan soal terlebih dahulu.`,
    };
  }
  await prisma.tryoutSession.delete({ where: { id } });
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath('/dashboard/tryout');
  return { ok: true };
}

export async function toggleTryoutSessionActiveAction(
  id: string,
  isActive: boolean,
): Promise<CmsTryoutActionResult> {
  await requireAdminAction();
  await prisma.tryoutSession.update({ where: { id }, data: { isActive } });
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath('/dashboard/tryout');
  return { ok: true };
}
