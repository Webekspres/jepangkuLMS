'use server';

import type { JlptQuestionSetStatus, LevelJLPT, TryoutSectionCode } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  contentLockedMessage,
  getActiveSessionCountForSet,
  validateQuestionSetForReady,
} from '@/features/admin-cms/lib/jlpt-question-set-stats';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { prisma } from '@/lib/prisma';
import { levelJlptSchema } from '@/lib/validations/shared';

export type CmsQuestionSetActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

function revalidatePaket(setId?: string) {
  revalidatePath(ADMIN_ROUTES.tryoutPaket);
  revalidatePath(ADMIN_ROUTES.tryoutSessions);
  revalidatePath(ADMIN_ROUTES.tryoutBank);
  if (setId) revalidatePath(ADMIN_ROUTES.tryoutPaketDetail(setId));
}

async function assertContentEditable(questionSetId: string) {
  const set = await prisma.jlptQuestionSet.findUnique({ where: { id: questionSetId } });
  if (!set) return { ok: false as const, message: 'Paket tidak ditemukan.' };
  const activeCount = await getActiveSessionCountForSet(questionSetId);
  if (activeCount > 0) {
    return {
      ok: false as const,
      message: contentLockedMessage(set.title, activeCount),
    };
  }
  return { ok: true as const, set };
}

async function nextItemSort(questionSetId: string, section: TryoutSectionCode): Promise<number> {
  const agg = await prisma.jlptQuestionSetItem.aggregate({
    where: { questionSetId, section },
    _max: { sortOrder: true },
  });
  return (agg._max.sortOrder ?? 0) + 1;
}

export async function createJlptQuestionSetAction(
  formData: FormData,
): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const title = String(formData.get('title') ?? '').trim();
  const levelRaw = String(formData.get('level') ?? 'N5').trim();
  const levelParsed = levelJlptSchema.safeParse(levelRaw);
  const level: LevelJLPT = levelParsed.success ? levelParsed.data : 'N5';
  const codeRaw = String(formData.get('code') ?? '')
    .trim()
    .toUpperCase();

  if (!title) return { ok: false, message: 'Judul paket wajib diisi.' };

  // Auto code from level + slug title if admin didn't provide one
  let code = codeRaw;
  if (!code) {
    const slug = title
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);
    code = `${level}-PKG-${slug || 'A'}`;
    const clash = await prisma.jlptQuestionSet.findUnique({ where: { code } });
    if (clash) {
      code = `${level}-PKG-${Date.now().toString(36).toUpperCase()}`;
    }
  } else {
    const existing = await prisma.jlptQuestionSet.findUnique({ where: { code } });
    if (existing) return { ok: false, message: `Kode "${code}" sudah dipakai.` };
  }

  const row = await prisma.jlptQuestionSet.create({
    data: {
      code,
      title,
      level,
      status: 'DRAFT',
    },
  });

  revalidatePaket(row.id);
  return { ok: true, id: row.id };
}

export async function updateJlptQuestionSetMetaAction(
  id: string,
  formData: FormData,
): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const existing = await prisma.jlptQuestionSet.findUnique({
    where: { id },
    include: { _count: { select: { items: true, sessions: true } } },
  });
  if (!existing) return { ok: false, message: 'Paket tidak ditemukan.' };

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { ok: false, message: 'Judul paket wajib diisi.' };

  await prisma.jlptQuestionSet.update({
    where: { id },
    data: { title },
  });

  revalidatePaket(id);
  return { ok: true, id };
}

export async function setJlptQuestionSetStatusAction(
  id: string,
  status: JlptQuestionSetStatus,
): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const existing = await prisma.jlptQuestionSet.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: 'Paket tidak ditemukan.' };

  if (status === 'READY') {
    const check = await validateQuestionSetForReady(id);
    if (!check.ok) return check;
  }

  await prisma.jlptQuestionSet.update({ where: { id }, data: { status } });
  revalidatePaket(id);
  return { ok: true, id };
}

export async function duplicateJlptQuestionSetAction(
  id: string,
  formData: FormData,
): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const source = await prisma.jlptQuestionSet.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!source) return { ok: false, message: 'Paket sumber tidak ditemukan.' };

  const newCode = String(formData.get('code') ?? '')
    .trim()
    .toUpperCase();
  const newTitle = String(formData.get('title') ?? '').trim() || `${source.title} (salinan)`;

  if (!newCode) return { ok: false, message: 'Kode paket baru wajib diisi (pilih sendiri).' };
  if (newCode === source.code) {
    return { ok: false, message: 'Kode baru harus berbeda dari paket sumber.' };
  }

  const clash = await prisma.jlptQuestionSet.findUnique({ where: { code: newCode } });
  if (clash) return { ok: false, message: `Kode "${newCode}" sudah dipakai.` };

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.jlptQuestionSet.create({
      data: {
        code: newCode,
        title: newTitle,
        level: source.level,
        description: source.description,
        source: source.source,
        year: source.year,
        status: 'DRAFT',
      },
    });
    if (source.items.length > 0) {
      await tx.jlptQuestionSetItem.createMany({
        data: source.items.map((item) => ({
          questionSetId: row.id,
          section: item.section,
          sortOrder: item.sortOrder,
          jlptQuestionId: item.jlptQuestionId,
          listeningStimulusId: item.listeningStimulusId,
        })),
      });
    }
    return row;
  });

  revalidatePaket(created.id);
  return { ok: true, id: created.id };
}

export async function deleteJlptQuestionSetAction(
  id: string,
): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const existing = await prisma.jlptQuestionSet.findUnique({
    where: { id },
    include: { _count: { select: { sessions: true } } },
  });
  if (!existing) return { ok: false, message: 'Paket tidak ditemukan.' };
  if (existing._count.sessions > 0) {
    return {
      ok: false,
      message: 'Paket masih dipakai sesi. Arsipkan saja, atau lepaskan dari sesi dulu.',
    };
  }

  await prisma.jlptQuestionSet.delete({ where: { id } });
  revalidatePaket();
  return { ok: true };
}

export async function addQuestionToSetAction(input: {
  questionSetId: string;
  questionId: string;
}): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const gate = await assertContentEditable(input.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };
  const set = gate.set;

  const question = await prisma.jlptQuestion.findUnique({ where: { id: input.questionId } });
  if (!question) return { ok: false, message: 'Soal bank tidak ditemukan.' };
  if (question.section === 'CHOKAI') {
    return { ok: false, message: 'Soal CHOKAI ditambahkan lewat stimulus.' };
  }
  if (question.status === 'RETIRED') {
    return { ok: false, message: 'Soal sudah diarsipkan (RETIRED).' };
  }
  if (question.level !== set.level) {
    return { ok: false, message: `Level soal (${question.level}) tidak cocok dengan paket.` };
  }

  const exists = await prisma.jlptQuestionSetItem.findFirst({
    where: { questionSetId: input.questionSetId, jlptQuestionId: input.questionId },
  });
  if (exists) return { ok: false, message: 'Soal sudah ada di paket ini.' };

  const sortOrder = await nextItemSort(input.questionSetId, question.section);
  await prisma.jlptQuestionSetItem.create({
    data: {
      questionSetId: input.questionSetId,
      section: question.section,
      sortOrder,
      jlptQuestionId: question.id,
    },
  });

  // Downgrade READY if we want integrity — keep status; validate on READY again.
  revalidatePaket(input.questionSetId);
  return { ok: true };
}

export async function addStimulusToSetAction(input: {
  questionSetId: string;
  stimulusId: string;
}): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const gate = await assertContentEditable(input.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };
  const set = gate.set;

  const stimulus = await prisma.listeningStimulus.findUnique({
    where: { id: input.stimulusId },
    include: { _count: { select: { questions: { where: { status: { not: 'RETIRED' } } } } } },
  });
  if (!stimulus) return { ok: false, message: 'Stimulus tidak ditemukan.' };
  if (stimulus.status === 'RETIRED') {
    return { ok: false, message: 'Stimulus sudah diarsipkan (RETIRED).' };
  }
  if (stimulus.level !== set.level) {
    return { ok: false, message: 'Level stimulus tidak cocok dengan paket.' };
  }
  if (stimulus._count.questions === 0) {
    return { ok: false, message: 'Stimulus belum punya soal aktif.' };
  }

  const exists = await prisma.jlptQuestionSetItem.findFirst({
    where: { questionSetId: input.questionSetId, listeningStimulusId: input.stimulusId },
  });
  if (exists) return { ok: false, message: 'Stimulus sudah ada di paket ini.' };

  const sortOrder = await nextItemSort(input.questionSetId, 'CHOKAI');
  await prisma.jlptQuestionSetItem.create({
    data: {
      questionSetId: input.questionSetId,
      section: 'CHOKAI',
      sortOrder,
      listeningStimulusId: stimulus.id,
    },
  });

  revalidatePaket(input.questionSetId);
  return { ok: true };
}

export async function removeSetItemAction(itemId: string): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const item = await prisma.jlptQuestionSetItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false, message: 'Item tidak ditemukan.' };

  const gate = await assertContentEditable(item.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };

  await prisma.jlptQuestionSetItem.delete({ where: { id: itemId } });
  revalidatePaket(item.questionSetId);
  return { ok: true };
}

export async function reorderSetItemsAction(input: {
  questionSetId: string;
  section: TryoutSectionCode;
  orderedItemIds: string[];
}): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const gate = await assertContentEditable(input.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };

  await prisma.$transaction(
    input.orderedItemIds.map((id, index) =>
      prisma.jlptQuestionSetItem.updateMany({
        where: { id, questionSetId: input.questionSetId, section: input.section },
        data: { sortOrder: index + 1 },
      }),
    ),
  );
  revalidatePaket(input.questionSetId);
  return { ok: true };
}

/**
 * Create a Moji/Bunpou question inside a package (bank atom + set item in one step).
 */
export async function createQuestionInSetAction(input: {
  questionSetId: string;
  section: 'MOJI_GOI' | 'BUNPOU_DOKKAI';
  questionText: string;
  explanation?: string;
  options: { text: string; isCorrect: boolean }[];
}): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const gate = await assertContentEditable(input.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };
  const set = gate.set;

  const questionText = input.questionText.trim();
  if (!questionText) return { ok: false, message: 'Teks soal wajib diisi.' };
  if (input.options.length < 2) return { ok: false, message: 'Minimal 2 opsi.' };
  if (input.options.some((o) => !o.text.trim())) {
    return { ok: false, message: 'Semua opsi wajib diisi.' };
  }
  if (input.options.filter((o) => o.isCorrect).length !== 1) {
    return { ok: false, message: 'Pilih tepat satu jawaban benar.' };
  }

  const abbr = input.section === 'MOJI_GOI' ? 'MG' : 'BD';
  const count = await prisma.jlptQuestion.count({
    where: { level: set.level, section: input.section },
  });
  let code = `${set.level}-${abbr}-${String(count + 1).padStart(3, '0')}`;
  // Ensure unique
  for (let i = 0; i < 20; i++) {
    const clash = await prisma.jlptQuestion.findUnique({ where: { code } });
    if (!clash) break;
    code = `${set.level}-${abbr}-${String(count + 1 + i + 1).padStart(3, '0')}`;
  }

  const sortOrder = await nextItemSort(input.questionSetId, input.section);

  await prisma.$transaction(async (tx) => {
    const q = await tx.jlptQuestion.create({
      data: {
        code,
        level: set.level,
        section: input.section,
        status: 'ACTIVE',
        questionText,
        explanation: input.explanation?.trim() || null,
        answerOptionKind: 'TEXT',
        options: {
          create: input.options.map((opt, index) => ({
            text: opt.text.trim(),
            isCorrect: opt.isCorrect,
            sortOrder: index,
          })),
        },
      },
    });
    await tx.jlptQuestionSetItem.create({
      data: {
        questionSetId: input.questionSetId,
        section: input.section,
        sortOrder,
        jlptQuestionId: q.id,
      },
    });
  });

  revalidatePaket(input.questionSetId);
  return { ok: true };
}

/**
 * Create a Choukai stimulus + one question inside a package (audio + optional image).
 */
export async function createChokaiInSetAction(input: {
  questionSetId: string;
  instructionText?: string;
  questionText: string;
  explanation?: string;
  options: { text: string; isCorrect: boolean }[];
  audioUrl?: string | null;
  audioObjectKey?: string | null;
  audioStartMs?: number;
  audioEndMs?: number | null;
  imageUrl?: string | null;
  imageObjectKey?: string | null;
}): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const gate = await assertContentEditable(input.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };
  const set = gate.set;

  const questionText = input.questionText.trim();
  if (!questionText) return { ok: false, message: 'Teks soal wajib diisi.' };
  if (!input.audioUrl?.trim()) {
    return { ok: false, message: 'Audio Choukai wajib diunggah.' };
  }
  if (input.options.length < 2) return { ok: false, message: 'Minimal 2 opsi.' };
  if (input.options.some((o) => !o.text.trim())) {
    return { ok: false, message: 'Semua opsi wajib diisi.' };
  }
  if (input.options.filter((o) => o.isCorrect).length !== 1) {
    return { ok: false, message: 'Pilih tepat satu jawaban benar.' };
  }

  const stimCount = await prisma.listeningStimulus.count({ where: { level: set.level } });
  let stimCode = `${set.level}-CH-S${String(stimCount + 1).padStart(3, '0')}`;
  for (let i = 0; i < 20; i++) {
    const clash = await prisma.listeningStimulus.findUnique({ where: { code: stimCode } });
    if (!clash) break;
    stimCode = `${set.level}-CH-S${String(stimCount + 1 + i + 1).padStart(3, '0')}`;
  }

  const qCount = await prisma.jlptQuestion.count({
    where: { level: set.level, section: 'CHOKAI' },
  });
  let qCode = `${set.level}-CH-${String(qCount + 1).padStart(3, '0')}`;
  for (let i = 0; i < 20; i++) {
    const clash = await prisma.jlptQuestion.findUnique({ where: { code: qCode } });
    if (!clash) break;
    qCode = `${set.level}-CH-${String(qCount + 1 + i + 1).padStart(3, '0')}`;
  }

  const sortOrder = await nextItemSort(input.questionSetId, 'CHOKAI');
  const startMs = Math.max(0, Math.trunc(input.audioStartMs ?? 0));
  const endMs =
    input.audioEndMs != null && Number.isFinite(input.audioEndMs)
      ? Math.trunc(input.audioEndMs)
      : null;
  if (endMs != null && endMs <= startMs) {
    return { ok: false, message: 'Waktu selesai audio harus lebih besar dari mulai.' };
  }

  await prisma.$transaction(async (tx) => {
    const stim = await tx.listeningStimulus.create({
      data: {
        code: stimCode,
        level: set.level,
        status: 'ACTIVE',
        instructionText: input.instructionText?.trim() || null,
        audioUrl: input.audioUrl!.trim(),
        audioObjectKey: input.audioObjectKey?.trim() || null,
        audioStartMs: startMs,
        audioEndMs: endMs,
        imageUrl: input.imageUrl?.trim() || null,
        imageObjectKey: input.imageObjectKey?.trim() || null,
      },
    });
    await tx.jlptQuestion.create({
      data: {
        code: qCode,
        level: set.level,
        section: 'CHOKAI',
        status: 'ACTIVE',
        questionText,
        explanation: input.explanation?.trim() || null,
        answerOptionKind: 'TEXT',
        listeningStimulusId: stim.id,
        stimulusSortOrder: 1,
        options: {
          create: input.options.map((opt, index) => ({
            text: opt.text.trim(),
            isCorrect: opt.isCorrect,
            sortOrder: index,
          })),
        },
      },
    });
    await tx.jlptQuestionSetItem.create({
      data: {
        questionSetId: input.questionSetId,
        section: 'CHOKAI',
        sortOrder,
        listeningStimulusId: stim.id,
      },
    });
  });

  revalidatePaket(input.questionSetId);
  return { ok: true };
}
