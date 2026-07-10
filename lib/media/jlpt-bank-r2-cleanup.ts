/**
 * JLPT bank R2 lifecycle — release object keys from DB, delete from R2 when unreferenced.
 * Only manages keys under `jlpt-bank/` (see buildJlptBankObjectKey).
 */
import { deleteFromR2 } from '@/lib/r2';
import { prisma } from '@/lib/prisma';

const JLPT_BANK_KEY_PREFIX = 'jlpt-bank/';

export function normalizeJlptBankObjectKey(key: string | null | undefined): string | null {
  const trimmed = key?.trim();
  return trimmed ? trimmed : null;
}

export function isManagedJlptBankObjectKey(key: string | null | undefined): key is string {
  const normalized = normalizeJlptBankObjectKey(key);
  return Boolean(normalized?.startsWith(JLPT_BANK_KEY_PREFIX));
}

/** Track keys replaced during import/update; call after DB commit. */
export function trackReplacedJlptBankKey(
  bucket: string[],
  previous: string | null | undefined,
  next: string | null | undefined,
): void {
  const oldKey = normalizeJlptBankObjectKey(previous);
  const newKey = normalizeJlptBankObjectKey(next);
  if (oldKey && oldKey !== newKey && isManagedJlptBankObjectKey(oldKey)) {
    bucket.push(oldKey);
  }
}

export async function countJlptBankObjectKeyReferences(objectKey: string): Promise<number> {
  const key = normalizeJlptBankObjectKey(objectKey);
  if (!key) return 0;

  const [stimAudio, stimImage, stem, option] = await Promise.all([
    prisma.listeningStimulus.count({ where: { audioObjectKey: key } }),
    prisma.listeningStimulus.count({ where: { imageObjectKey: key } }),
    prisma.jlptQuestion.count({ where: { stemImageObjectKey: key } }),
    prisma.jlptQuestionOption.count({ where: { imageObjectKey: key } }),
  ]);

  return stimAudio + stimImage + stem + option;
}

export async function deleteJlptBankObjectKeyIfOrphaned(
  objectKey: string | null | undefined,
): Promise<void> {
  const key = normalizeJlptBankObjectKey(objectKey);
  if (!key || !isManagedJlptBankObjectKey(key)) return;

  const refs = await countJlptBankObjectKeyReferences(key);
  if (refs > 0) return;

  await deleteFromR2(key).catch(() => undefined);
}

export async function deleteJlptBankObjectKeysIfOrphaned(
  keys: Iterable<string | null | undefined>,
): Promise<void> {
  const unique = new Set<string>();
  for (const key of keys) {
    const normalized = normalizeJlptBankObjectKey(key);
    if (normalized && isManagedJlptBankObjectKey(normalized)) {
      unique.add(normalized);
    }
  }

  await Promise.all([...unique].map((key) => deleteJlptBankObjectKeyIfOrphaned(key)));
}

export async function releaseJlptQuestionR2Assets(questionId: string): Promise<void> {
  const question = await prisma.jlptQuestion.findUnique({
    where: { id: questionId },
    include: { options: { select: { id: true, imageObjectKey: true } } },
  });
  if (!question) return;

  const keys = [
    question.stemImageObjectKey,
    ...question.options.map((option) => option.imageObjectKey),
  ];

  await prisma.$transaction([
    prisma.jlptQuestion.update({
      where: { id: questionId },
      data: {
        stemImageObjectKey: null,
        stemImageUrl: null,
      },
    }),
    ...question.options
      .filter((option) => option.imageObjectKey)
      .map((option) =>
        prisma.jlptQuestionOption.update({
          where: { id: option.id },
          data: {
            imageObjectKey: null,
            imageUrl: null,
          },
        }),
      ),
  ]);

  await deleteJlptBankObjectKeysIfOrphaned(keys);
}

export async function releaseListeningStimulusR2Assets(stimulusId: string): Promise<void> {
  const stimulus = await prisma.listeningStimulus.findUnique({
    where: { id: stimulusId },
    select: { audioObjectKey: true, imageObjectKey: true },
  });
  if (!stimulus) return;

  const keys = [stimulus.audioObjectKey, stimulus.imageObjectKey];

  await prisma.listeningStimulus.update({
    where: { id: stimulusId },
    data: {
      audioObjectKey: null,
      audioUrl: null,
      audioDurationMs: null,
      audioOriginalName: null,
      imageObjectKey: null,
      imageUrl: null,
    },
  });

  await deleteJlptBankObjectKeysIfOrphaned(keys);
}
