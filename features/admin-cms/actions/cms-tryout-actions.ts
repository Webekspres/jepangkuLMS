'use server';

import type { LevelJLPT } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { validateSessionActivate } from '@/features/admin-cms/lib/jlpt-question-set-stats';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/string-helpers';
import { levelJlptSchema } from '@/lib/validations/shared';

export type CmsTryoutActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

function parseTryoutForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const codeRaw = String(formData.get('code') ?? '').trim();
  // phaseLabel kept in DB for student UI compat — default to title (no separate admin field).
  const phaseLabel = String(formData.get('phaseLabel') ?? '').trim() || title;
  const description = String(formData.get('description') ?? '').trim() || null;
  const scheduledAtRaw = String(formData.get('scheduledAt') ?? '').trim();
  const timeLimitMinutes = Number(formData.get('timeLimitMinutes') ?? 120) || 120;
  const sortOrder = Number(formData.get('sortOrder') ?? 0) || 0;
  const isActive = formData.get('isActive') === 'on';
  const isStrictTimeBound = formData.get('isStrictTimeBound') === 'on';
  const priceIdr = Math.max(0, Math.trunc(Number(formData.get('priceIdr') ?? 0) || 0));
  const levelRaw = String(formData.get('level') ?? 'N5').trim();
  const levelParsed = levelJlptSchema.safeParse(levelRaw);
  const level: LevelJLPT = levelParsed.success ? levelParsed.data : 'N5';
  const code = generateSlug(codeRaw || title);
  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
  const questionSetRaw = String(formData.get('questionSetId') ?? '').trim();
  const questionSetId = questionSetRaw && questionSetRaw !== '__none__' ? questionSetRaw : null;

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
    level,
    questionSetId,
  };
}

function validateTryout(data: ReturnType<typeof parseTryoutForm>): string | null {
  if (!data.title) return 'Judul sesi wajib diisi.';
  if (!data.code) return 'Kode sesi tidak valid.';
  if (data.timeLimitMinutes < 10) return 'Durasi minimal 10 menit.';
  if (!levelJlptSchema.safeParse(data.level).success) return 'Level JLPT wajib dipilih.';
  return null;
}

async function assertPackageAttachable(
  questionSetId: string | null,
  level: LevelJLPT,
): Promise<string | null> {
  if (!questionSetId) return null;
  const set = await prisma.jlptQuestionSet.findUnique({ where: { id: questionSetId } });
  if (!set) return 'Paket Soal tidak ditemukan.';
  if (set.status !== 'READY') return `Paket harus READY (sekarang: ${set.status}).`;
  if (set.level !== level) {
    return `Level paket (${set.level}) harus sama dengan level sesi (${level}).`;
  }
  return null;
}

export async function createTryoutSessionAction(formData: FormData): Promise<CmsTryoutActionResult> {
  await requireAdminAction();
  const data = parseTryoutForm(formData);
  const error = validateTryout(data);
  if (error) return { ok: false, message: error };

  const existing = await prisma.tryoutSession.findUnique({ where: { code: data.code } });
  if (existing) return { ok: false, message: `Kode "${data.code}" sudah dipakai.` };

  const attachError = await assertPackageAttachable(data.questionSetId, data.level);
  if (attachError) return { ok: false, message: attachError };

  if (data.isActive) {
    if (!data.questionSetId) {
      return { ok: false, message: 'Pilih Paket Soal sebelum mengaktifkan sesi.' };
    }
    // Create inactive first, then validate activate against the new id — validate by package fields.
    const probe = await prisma.tryoutSession.create({
      data: {
        code: data.code,
        title: data.title,
        phaseLabel: data.phaseLabel,
        description: data.description,
        scheduledAt: data.scheduledAt,
        timeLimitMinutes: data.timeLimitMinutes,
        sortOrder: data.sortOrder,
        isActive: false,
        isStrictTimeBound: data.isStrictTimeBound,
        priceIdr: data.priceIdr,
        level: data.level,
        questionSetId: data.questionSetId,
      },
    });
    const gate = await validateSessionActivate(probe.id);
    if (!gate.ok) {
      await prisma.tryoutSession.delete({ where: { id: probe.id } });
      return { ok: false, message: gate.message };
    }
    await prisma.tryoutSession.update({ where: { id: probe.id }, data: { isActive: true } });
    revalidatePath(ADMIN_ROUTES.tryoutSessions);
    revalidatePath(ADMIN_ROUTES.tryoutPaket);
    revalidatePath('/dashboard/tryout');
    return { ok: true, id: probe.id };
  }

  const row = await prisma.tryoutSession.create({
    data: {
      code: data.code,
      title: data.title,
      phaseLabel: data.phaseLabel,
      description: data.description,
      scheduledAt: data.scheduledAt,
      timeLimitMinutes: data.timeLimitMinutes,
      sortOrder: data.sortOrder,
      isActive: false,
      isStrictTimeBound: data.isStrictTimeBound,
      priceIdr: data.priceIdr,
      level: data.level,
      questionSetId: data.questionSetId,
    },
  });

  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath(ADMIN_ROUTES.tryoutPaket);
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

  if (
    existing.isActive &&
    data.questionSetId !== existing.questionSetId
  ) {
    return {
      ok: false,
      message: 'Tidak bisa ganti Paket Soal pada sesi aktif. Nonaktifkan sesi dulu.',
    };
  }

  const attachError = await assertPackageAttachable(data.questionSetId, data.level);
  if (attachError) return { ok: false, message: attachError };

  if (data.isActive) {
    const gate = await validateSessionActivate(id, {
      questionSetId: data.questionSetId,
      level: data.level,
    });
    if (!gate.ok) return { ok: false, message: gate.message };
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
      level: data.level,
      questionSetId: data.questionSetId,
    },
  });

  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath(ADMIN_ROUTES.tryoutPaket);
  revalidatePath('/dashboard/tryout');
  return { ok: true, id };
}

export async function deleteTryoutSessionAction(id: string): Promise<CmsTryoutActionResult> {
  await requireAdminAction();
  await prisma.tryoutSession.delete({ where: { id } });
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath(ADMIN_ROUTES.tryoutBank);
  revalidatePath(ADMIN_ROUTES.tryoutPaket);
  revalidatePath('/dashboard/tryout');
  return { ok: true };
}

export async function toggleTryoutSessionActiveAction(
  id: string,
  isActive: boolean,
): Promise<CmsTryoutActionResult> {
  await requireAdminAction();
  if (isActive) {
    const gate = await validateSessionActivate(id);
    if (!gate.ok) return { ok: false, message: gate.message };
  }
  await prisma.tryoutSession.update({ where: { id }, data: { isActive } });
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath(ADMIN_ROUTES.tryoutPaket);
  revalidatePath('/dashboard/tryout');
  return { ok: true };
}
