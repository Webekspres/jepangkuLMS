'use server';

import { revalidatePath } from 'next/cache';
import type { LevelJLPT, Prisma } from '@prisma/client';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import {
  deletePreviousCoverIfManaged,
  resolveCoverImageUrl,
} from '@/lib/media/cover-image';
import { prisma } from '@/lib/prisma';
import { slugifyTitle } from '@/lib/lms/slug';
export type CmsLiveClassActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

const JLPT_LEVELS: LevelJLPT[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

type ParsedSession = {
  title: string;
  scheduledAt: Date;
  endsAt: Date;
  meetingUrl: string | null;
  recordingUrl: string | null;
};

type RawSession = {
  title?: unknown;
  scheduledAt?: unknown;
  endsAt?: unknown;
  meetingUrl?: unknown;
  recordingUrl?: unknown;
};

function parseSessions(formData: FormData): ParsedSession[] {
  const raw = String(formData.get('sessionsJson') ?? '').trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item) => {
    const session = item as RawSession;
    return {
      title: String(session.title ?? '').trim(),
      scheduledAt: new Date(String(session.scheduledAt ?? '')),
      endsAt: new Date(String(session.endsAt ?? '')),
      meetingUrl: String(session.meetingUrl ?? '').trim() || null,
      recordingUrl: String(session.recordingUrl ?? '').trim() || null,
    };
  });
}

function parseLiveClassForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const senseiName = String(formData.get('senseiName') ?? '').trim();
  const senseiLevel = String(formData.get('senseiLevel') ?? '').trim() || null;
  const category = String(formData.get('category') ?? '').trim();
  const level = String(formData.get('level') ?? 'N5') as LevelJLPT;
  const priceIdr = Math.max(0, Math.trunc(Number(formData.get('priceIdr') ?? 0) || 0));
  const maxSlots = Number(formData.get('maxSlots') ?? 30) || 30;
  const filledSlots = Number(formData.get('filledSlots') ?? 0) || 0;
  const paymentLink = String(formData.get('paymentLink') ?? '').trim() || null;
  const isPublished = formData.get('isPublished') === 'on';
  const sessions = parseSessions(formData);

  return {
    title,
    description,
    senseiName,
    senseiLevel,
    category,
    level,
    priceIdr,
    maxSlots,
    filledSlots,
    paymentLink,
    isPublished,
    sessions,
  };
}

function validateLiveClass(data: ReturnType<typeof parseLiveClassForm>): string | null {
  if (!data.title) return 'Judul kelas wajib diisi.';
  if (!data.description) return 'Deskripsi wajib diisi.';
  if (!data.senseiName) return 'Nama sensei wajib diisi.';
  if (!data.category) return 'Kategori wajib diisi.';
  if (!JLPT_LEVELS.includes(data.level)) return 'Level JLPT tidak valid.';
  if (data.priceIdr < 0) return 'Harga tidak valid.';
  if (data.maxSlots < 1) return 'Kapasitas minimal 1.';
  if (data.filledSlots < 0 || data.filledSlots > data.maxSlots) {
    return 'Jumlah peserta tidak valid.';
  }
  for (const [index, session] of data.sessions.entries()) {
    const label = `Pertemuan ${index + 1}`;
    if (!session.title) return `${label}: judul wajib diisi.`;
    if (Number.isNaN(session.scheduledAt.getTime())) return `${label}: jadwal mulai tidak valid.`;
    if (Number.isNaN(session.endsAt.getTime())) return `${label}: jadwal selesai tidak valid.`;
    if (session.endsAt <= session.scheduledAt) {
      return `${label}: waktu selesai harus setelah waktu mulai.`;
    }
  }
  return null;
}

function toScalarData(data: ReturnType<typeof parseLiveClassForm>) {
  return {
    title: data.title,
    description: data.description,
    senseiName: data.senseiName,
    senseiLevel: data.senseiLevel,
    category: data.category,
    level: data.level,
    priceIdr: data.priceIdr,
    maxSlots: data.maxSlots,
    filledSlots: data.filledSlots,
    paymentLink: data.paymentLink,
    isPublished: data.isPublished,
  };
}

function toSessionCreateData(
  sessions: ParsedSession[],
): Prisma.LiveClassSessionCreateWithoutLiveClassInput[] {
  return sessions.map((session) => ({
    title: session.title,
    scheduledAt: session.scheduledAt,
    endsAt: session.endsAt,
    meetingUrl: session.meetingUrl,
    recordingUrl: session.recordingUrl,
  }));
}

export async function createLiveClassAction(formData: FormData): Promise<CmsLiveClassActionResult> {
  await requireAdminAction();
  const data = parseLiveClassForm(formData);
  const error = validateLiveClass(data);
  if (error) return { ok: false, message: error };

  let coverImageUrl: string | null = null;
  try {
    const cover = await resolveCoverImageUrl({
      kind: 'live-class',
      slug: slugifyTitle(data.title) || 'live-class',
      formData,
    });
    coverImageUrl = cover.url;
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Gagal mengunggah cover live class.',
    };
  }

  const row = await prisma.liveClass.create({
    data: {
      ...toScalarData(data),
      coverImageUrl,
      sessions: { create: toSessionCreateData(data.sessions) },
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

  let coverImageUrl = existing.coverImageUrl;
  try {
    const cover = await resolveCoverImageUrl({
      kind: 'live-class',
      slug: slugifyTitle(data.title) || id,
      formData,
      existingUrl: existing.coverImageUrl,
    });
    coverImageUrl = cover.url;
    if (cover.replaced || cover.url !== existing.coverImageUrl) {
      await deletePreviousCoverIfManaged(existing.coverImageUrl);
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Gagal mengunggah cover live class.',
    };
  }

  // Reconcile sesi secara idempotent: ganti penuh dengan definisi terbaru.
  await prisma.$transaction([
    prisma.liveClass.update({
      where: { id },
      data: { ...toScalarData(data), coverImageUrl },
    }),
    prisma.liveClassSession.deleteMany({ where: { liveClassId: id } }),
    prisma.liveClassSession.createMany({
      data: data.sessions.map((session) => ({
        liveClassId: id,
        title: session.title,
        scheduledAt: session.scheduledAt,
        endsAt: session.endsAt,
        meetingUrl: session.meetingUrl,
        recordingUrl: session.recordingUrl,
      })),
    }),
  ]);

  revalidatePath(ADMIN_ROUTES.liveClass);
  revalidatePath('/dashboard/live-class');
  return { ok: true, id };
}

export async function deleteLiveClassAction(id: string): Promise<CmsLiveClassActionResult> {
  await requireAdminAction();
  const existing = await prisma.liveClass.findUnique({
    where: { id },
    select: { coverImageUrl: true },
  });
  await prisma.liveClass.delete({ where: { id } });
  await deletePreviousCoverIfManaged(existing?.coverImageUrl);
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
