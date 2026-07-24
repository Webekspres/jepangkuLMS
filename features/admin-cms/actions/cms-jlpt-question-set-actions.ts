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
import {
  collectQuestionAssetKeys,
  collectStimulusAssetKeys,
  deleteTryoutChokaiObjectKeysIfOrphaned,
  isQuestionExclusiveToSet,
  isStimulusExclusiveToSet,
  resolveManagedObjectKey,
  trackReplacedTryoutChokaiKey,
} from '@/lib/media/tryout-chokai-r2-cleanup';
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

export async function updateJlptQuestionSetChokaiAudioAction(input: {
  questionSetId: string;
  audioUrl: string | null;
  audioObjectKey?: string | null;
  audioOriginalName?: string | null;
  audioDurationMs?: number | null;
}): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const gate = await assertContentEditable(input.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };

  const existing = await prisma.jlptQuestionSet.findUnique({
    where: { id: input.questionSetId },
    select: { chokaiAudioObjectKey: true, chokaiAudioUrl: true },
  });
  if (!existing) return { ok: false, message: 'Paket tidak ditemukan.' };

  const url = input.audioUrl?.trim() || null;
  const nextKey = url
    ? resolveManagedObjectKey({
        objectKey: input.audioObjectKey,
        url,
      })
    : null;

  const keysToRelease: string[] = [];
  trackReplacedTryoutChokaiKey(
    keysToRelease,
    resolveManagedObjectKey({
      objectKey: existing.chokaiAudioObjectKey,
      url: existing.chokaiAudioUrl,
    }),
    nextKey,
  );

  await prisma.jlptQuestionSet.update({
    where: { id: input.questionSetId },
    data: {
      chokaiAudioUrl: url,
      chokaiAudioObjectKey: nextKey,
      chokaiAudioOriginalName: url ? input.audioOriginalName?.trim() || null : null,
      chokaiAudioDurationMs: url ? (input.audioDurationMs ?? null) : null,
    },
  });

  await deleteTryoutChokaiObjectKeysIfOrphaned(keysToRelease);

  revalidatePaket(input.questionSetId);
  return { ok: true, id: input.questionSetId };
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
        chokaiAudioUrl: source.chokaiAudioUrl,
        chokaiAudioObjectKey: source.chokaiAudioObjectKey,
        chokaiAudioDurationMs: source.chokaiAudioDurationMs,
        chokaiAudioOriginalName: source.chokaiAudioOriginalName,
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
    include: {
      _count: { select: { sessions: true } },
      items: {
        select: {
          jlptQuestionId: true,
          listeningStimulusId: true,
        },
      },
    },
  });
  if (!existing) return { ok: false, message: 'Paket tidak ditemukan.' };
  if (existing._count.sessions > 0) {
    return {
      ok: false,
      message: 'Paket masih dipakai sesi. Arsipkan saja, atau lepaskan dari sesi dulu.',
    };
  }

  const keysToRelease: string[] = [];
  const masterKey = resolveManagedObjectKey({
    objectKey: existing.chokaiAudioObjectKey,
    url: existing.chokaiAudioUrl,
  });
  if (masterKey) keysToRelease.push(masterKey);

  const exclusiveQuestionIds: string[] = [];
  const exclusiveStimulusIds: string[] = [];

  for (const item of existing.items) {
    if (item.jlptQuestionId) {
      if (await isQuestionExclusiveToSet(item.jlptQuestionId, id)) {
        keysToRelease.push(...(await collectQuestionAssetKeys(item.jlptQuestionId)));
        exclusiveQuestionIds.push(item.jlptQuestionId);
      }
    }
    if (item.listeningStimulusId) {
      if (await isStimulusExclusiveToSet(item.listeningStimulusId, id)) {
        keysToRelease.push(...(await collectStimulusAssetKeys(item.listeningStimulusId)));
        exclusiveStimulusIds.push(item.listeningStimulusId);
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.jlptQuestionSetItem.deleteMany({ where: { questionSetId: id } });

    for (const stimulusId of exclusiveStimulusIds) {
      await tx.jlptQuestion.deleteMany({ where: { listeningStimulusId: stimulusId } });
      await tx.listeningStimulus.delete({ where: { id: stimulusId } });
    }
    for (const questionId of exclusiveQuestionIds) {
      await tx.jlptQuestionOption.deleteMany({ where: { questionId } });
      await tx.jlptQuestion.delete({ where: { id: questionId } }).catch(() => undefined);
    }

    await tx.jlptQuestionSet.delete({ where: { id } });
  });

  await deleteTryoutChokaiObjectKeysIfOrphaned(keysToRelease);

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

  const keysToRelease: string[] = [];
  let exclusiveQuestionId: string | null = null;
  let exclusiveStimulusId: string | null = null;

  if (item.jlptQuestionId) {
    if (await isQuestionExclusiveToSet(item.jlptQuestionId, item.questionSetId)) {
      keysToRelease.push(...(await collectQuestionAssetKeys(item.jlptQuestionId)));
      exclusiveQuestionId = item.jlptQuestionId;
    }
  }
  if (item.listeningStimulusId) {
    if (await isStimulusExclusiveToSet(item.listeningStimulusId, item.questionSetId)) {
      keysToRelease.push(...(await collectStimulusAssetKeys(item.listeningStimulusId)));
      exclusiveStimulusId = item.listeningStimulusId;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.jlptQuestionSetItem.delete({ where: { id: itemId } });
    if (exclusiveStimulusId) {
      await tx.jlptQuestion.deleteMany({ where: { listeningStimulusId: exclusiveStimulusId } });
      await tx.listeningStimulus.delete({ where: { id: exclusiveStimulusId } });
    }
    if (exclusiveQuestionId) {
      await tx.jlptQuestionOption.deleteMany({ where: { questionId: exclusiveQuestionId } });
      await tx.jlptQuestion.delete({ where: { id: exclusiveQuestionId } }).catch(() => undefined);
    }
  });

  await deleteTryoutChokaiObjectKeysIfOrphaned(keysToRelease);

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
 * Create Choukai inside a package: stimulus path (optional audio/image/instruction) or standalone question.
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
  mondaiOrder?: number;
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
  const hasAudio = Boolean(input.audioUrl?.trim());
  const hasInstruction = Boolean(input.instructionText?.trim());
  const useStimulus = hasAudio || hasInstruction;

  const startMs = Math.max(0, Math.trunc(input.audioStartMs ?? 0));
  const endMs =
    input.audioEndMs != null && Number.isFinite(input.audioEndMs)
      ? Math.trunc(input.audioEndMs)
      : null;
  if (hasAudio && endMs != null && endMs <= startMs) {
    return { ok: false, message: 'Waktu selesai audio harus lebih besar dari mulai.' };
  }

  const optionCreates = input.options.map((opt, index) => ({
    text: opt.text.trim(),
    isCorrect: opt.isCorrect,
    sortOrder: index,
  }));

  const mondaiOrder = Math.max(1, Math.trunc(input.mondaiOrder ?? 1));
  const stemImageUrl = input.imageUrl?.trim() || null;
  const stemImageObjectKey = stemImageUrl
    ? resolveManagedObjectKey({
        objectKey: input.imageObjectKey,
        url: stemImageUrl,
      })
    : null;

  await prisma.$transaction(async (tx) => {
    if (!useStimulus) {
      const question = await tx.jlptQuestion.create({
        data: {
          code: qCode,
          level: set.level,
          section: 'CHOKAI',
          status: 'ACTIVE',
          questionText,
          explanation: input.explanation?.trim() || null,
          answerOptionKind: 'TEXT',
          mondaiOrder,
          stemImageUrl,
          stemImageObjectKey,
          options: { create: optionCreates },
        },
      });
      await tx.jlptQuestionSetItem.create({
        data: {
          questionSetId: input.questionSetId,
          section: 'CHOKAI',
          sortOrder,
          jlptQuestionId: question.id,
        },
      });
      return;
    }

    const stim = await tx.listeningStimulus.create({
      data: {
        code: stimCode,
        level: set.level,
        status: 'ACTIVE',
        instructionText: input.instructionText?.trim() || null,
        audioUrl: hasAudio ? input.audioUrl!.trim() : null,
        audioObjectKey: hasAudio ? input.audioObjectKey?.trim() || null : null,
        audioStartMs: startMs,
        audioEndMs: hasAudio ? endMs : null,
        imageUrl: null,
        imageObjectKey: null,
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
        mondaiOrder,
        stemImageUrl,
        stemImageObjectKey,
        options: { create: optionCreates },
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

function validateQuestionOptions(options: { text: string; isCorrect: boolean }[]) {
  if (options.length < 2) return 'Minimal 2 opsi.';
  if (options.some((o) => !o.text.trim())) return 'Semua opsi wajib diisi.';
  if (options.filter((o) => o.isCorrect).length !== 1) return 'Pilih tepat satu jawaban benar.';
  return null;
}

/**
 * Update Moji/Bunpou (atau Choukai soal tunggal) untuk item yang menunjuk jlptQuestionId.
 */
export async function updateQuestionInSetAction(input: {
  itemId: string;
  questionText: string;
  explanation?: string;
  options: { text: string; isCorrect: boolean }[];
}): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();

  const item = await prisma.jlptQuestionSetItem.findUnique({
    where: { id: input.itemId },
    include: { jlptQuestion: { select: { id: true, section: true } } },
  });
  if (!item?.jlptQuestionId || !item.jlptQuestion) {
    return { ok: false, message: 'Item soal tidak ditemukan atau bukan soal tunggal.' };
  }

  const gate = await assertContentEditable(item.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };

  const questionText = input.questionText.trim();
  if (!questionText) return { ok: false, message: 'Teks soal wajib diisi.' };
  const optError = validateQuestionOptions(input.options);
  if (optError) return { ok: false, message: optError };

  await prisma.$transaction(async (tx) => {
    await tx.jlptQuestion.update({
      where: { id: item.jlptQuestionId! },
      data: {
        questionText,
        explanation: input.explanation?.trim() || null,
      },
    });
    await tx.jlptQuestionOption.deleteMany({ where: { questionId: item.jlptQuestionId! } });
    await tx.jlptQuestionOption.createMany({
      data: input.options.map((opt, index) => ({
        questionId: item.jlptQuestionId!,
        text: opt.text.trim(),
        isCorrect: opt.isCorrect,
        sortOrder: index,
      })),
    });
  });

  revalidatePaket(item.questionSetId);
  return { ok: true };
}

/**
 * Update Choukai set item (stimulus + soal pertama, atau soal Choukai standalone).
 */
export async function updateChokaiSetItemAction(input: {
  itemId: string;
  instructionText?: string;
  questionText: string;
  explanation?: string;
  options: { text: string; isCorrect: boolean }[];
  audioUrl?: string | null;
  imageUrl?: string | null;
  imageObjectKey?: string | null;
  mondaiOrder?: number;
}): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();

  const item = await prisma.jlptQuestionSetItem.findUnique({
    where: { id: input.itemId },
    include: {
      listeningStimulus: {
        include: {
          questions: {
            where: { status: { not: 'RETIRED' } },
            orderBy: { stimulusSortOrder: 'asc' },
            take: 1,
            select: {
              id: true,
              stemImageObjectKey: true,
              stemImageUrl: true,
            },
          },
        },
      },
      jlptQuestion: {
        select: {
          id: true,
          section: true,
          stemImageObjectKey: true,
          stemImageUrl: true,
        },
      },
    },
  });
  if (!item) return { ok: false, message: 'Item tidak ditemukan.' };

  const gate = await assertContentEditable(item.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };

  const questionText = input.questionText.trim();
  if (!questionText) return { ok: false, message: 'Teks soal wajib diisi.' };
  const optError = validateQuestionOptions(input.options);
  if (optError) return { ok: false, message: optError };

  const mondaiOrder = Math.max(1, Math.trunc(input.mondaiOrder ?? 1));
  const stemImageUrl = input.imageUrl?.trim() || null;
  const stemImageObjectKey = stemImageUrl
    ? resolveManagedObjectKey({
        objectKey: input.imageObjectKey,
        url: stemImageUrl,
      })
    : null;
  const keysToRelease: string[] = [];

  if (item.jlptQuestionId && item.jlptQuestion?.section === 'CHOKAI') {
    trackReplacedTryoutChokaiKey(
      keysToRelease,
      resolveManagedObjectKey({
        objectKey: item.jlptQuestion.stemImageObjectKey,
        url: item.jlptQuestion.stemImageUrl,
      }),
      stemImageObjectKey,
    );
    await prisma.$transaction(async (tx) => {
      await tx.jlptQuestion.update({
        where: { id: item.jlptQuestionId! },
        data: {
          questionText,
          explanation: input.explanation?.trim() || null,
          mondaiOrder,
          stemImageUrl,
          stemImageObjectKey,
        },
      });
      await tx.jlptQuestionOption.deleteMany({ where: { questionId: item.jlptQuestionId! } });
      await tx.jlptQuestionOption.createMany({
        data: input.options.map((opt, index) => ({
          questionId: item.jlptQuestionId!,
          text: opt.text.trim(),
          isCorrect: opt.isCorrect,
          sortOrder: index,
        })),
      });
    });
    await deleteTryoutChokaiObjectKeysIfOrphaned(keysToRelease);
    revalidatePaket(item.questionSetId);
    return { ok: true };
  }

  if (!item.listeningStimulusId || !item.listeningStimulus) {
    return { ok: false, message: 'Item Choukai tidak valid.' };
  }

  const question = item.listeningStimulus.questions[0];
  if (!question) {
    return { ok: false, message: 'Stimulus belum punya soal aktif untuk diedit.' };
  }

  trackReplacedTryoutChokaiKey(
    keysToRelease,
    resolveManagedObjectKey({
      objectKey: question.stemImageObjectKey,
      url: question.stemImageUrl,
    }),
    stemImageObjectKey,
  );

  const stimulusAudioPatch =
    input.audioUrl !== undefined
      ? { audioUrl: input.audioUrl?.trim() || null }
      : {};

  await prisma.$transaction(async (tx) => {
    await tx.listeningStimulus.update({
      where: { id: item.listeningStimulusId! },
      data: {
        instructionText: input.instructionText?.trim() || null,
        ...stimulusAudioPatch,
      },
    });
    await tx.jlptQuestion.update({
      where: { id: question.id },
      data: {
        questionText,
        explanation: input.explanation?.trim() || null,
        mondaiOrder,
        stemImageUrl,
        stemImageObjectKey,
      },
    });
    await tx.jlptQuestionOption.deleteMany({ where: { questionId: question.id } });
    await tx.jlptQuestionOption.createMany({
      data: input.options.map((opt, index) => ({
        questionId: question.id,
        text: opt.text.trim(),
        isCorrect: opt.isCorrect,
        sortOrder: index,
      })),
    });
  });

  await deleteTryoutChokaiObjectKeysIfOrphaned(keysToRelease);
  revalidatePaket(item.questionSetId);
  return { ok: true };
}

/**
 * Remap Choukai `mondaiOrder` values to 1..N following the given tab order.
 * `orderedOldOrders` is the left-to-right list of previous mondaiOrder keys (incl. empty drafts).
 */
export async function renumberChokaiMondaiInSetAction(input: {
  questionSetId: string;
  orderedOldOrders: number[];
}): Promise<CmsQuestionSetActionResult> {
  await requireAdminAction();
  const gate = await assertContentEditable(input.questionSetId);
  if (!gate.ok) return { ok: false, message: gate.message };

  const ordered = input.orderedOldOrders
    .map((n) => Math.trunc(n))
    .filter((n) => Number.isFinite(n) && n >= 1);
  if (ordered.length === 0) {
    revalidatePaket(input.questionSetId);
    return { ok: true, id: input.questionSetId };
  }

  const orderMap = new Map<number, number>();
  ordered.forEach((oldOrder, index) => {
    if (!orderMap.has(oldOrder)) orderMap.set(oldOrder, index + 1);
  });

  const items = await prisma.jlptQuestionSetItem.findMany({
    where: { questionSetId: input.questionSetId, section: 'CHOKAI' },
    include: {
      jlptQuestion: { select: { id: true, mondaiOrder: true } },
      listeningStimulus: {
        select: {
          questions: {
            where: { status: { not: 'RETIRED' } },
            select: { id: true, mondaiOrder: true },
          },
        },
      },
    },
  });

  const questionUpdates: { id: string; oldOrder: number }[] = [];
  for (const item of items) {
    if (item.jlptQuestion) {
      questionUpdates.push({
        id: item.jlptQuestion.id,
        oldOrder: item.jlptQuestion.mondaiOrder,
      });
    }
    for (const q of item.listeningStimulus?.questions ?? []) {
      questionUpdates.push({ id: q.id, oldOrder: q.mondaiOrder });
    }
  }

  const toRemap = questionUpdates.filter((q) => orderMap.has(q.oldOrder));
  if (toRemap.length === 0) {
    revalidatePaket(input.questionSetId);
    return { ok: true, id: input.questionSetId };
  }

  await prisma.$transaction(async (tx) => {
    for (const q of toRemap) {
      await tx.jlptQuestion.update({
        where: { id: q.id },
        data: { mondaiOrder: q.oldOrder + 10_000 },
      });
    }
    for (const q of toRemap) {
      const next = orderMap.get(q.oldOrder)!;
      await tx.jlptQuestion.update({
        where: { id: q.id },
        data: { mondaiOrder: next },
      });
    }
  });

  revalidatePaket(input.questionSetId);
  return { ok: true, id: input.questionSetId };
}
