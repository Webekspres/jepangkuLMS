/**
 * Choukai / tryout paket R2 lifecycle.
 * Manages `tryouts/chokai/` and `jlpt-bank/` keys referenced by paket assets.
 */
import { deleteFromR2, extractR2KeyFromUrl } from '@/lib/r2';
import { prisma } from '@/lib/prisma';
import { TRYOUT_CHOKAI_KEY_PREFIX } from '@/lib/media/tryout-chokai-r2-paths';

const JLPT_BANK_KEY_PREFIX = 'jlpt-bank/';

export function normalizeTryoutChokaiObjectKey(key: string | null | undefined): string | null {
  const trimmed = key?.trim();
  return trimmed ? trimmed : null;
}

export function isManagedTryoutChokaiObjectKey(key: string | null | undefined): key is string {
  const normalized = normalizeTryoutChokaiObjectKey(key);
  if (!normalized) return false;
  return (
    normalized.startsWith(TRYOUT_CHOKAI_KEY_PREFIX) ||
    normalized.startsWith(JLPT_BANK_KEY_PREFIX)
  );
}

/** Prefer DB objectKey; fall back to logical key extracted from public URL. */
export function resolveManagedObjectKey(input: {
  objectKey?: string | null;
  url?: string | null;
}): string | null {
  const fromKey = normalizeTryoutChokaiObjectKey(input.objectKey);
  if (fromKey && isManagedTryoutChokaiObjectKey(fromKey)) return fromKey;
  const fromUrl = extractR2KeyFromUrl(input.url);
  if (fromUrl && isManagedTryoutChokaiObjectKey(fromUrl)) return fromUrl;
  return fromKey && isManagedTryoutChokaiObjectKey(fromKey) ? fromKey : null;
}

export function trackReplacedTryoutChokaiKey(
  bucket: string[],
  previous: string | null | undefined,
  next: string | null | undefined,
): void {
  const oldKey = normalizeTryoutChokaiObjectKey(previous);
  const newKey = normalizeTryoutChokaiObjectKey(next);
  if (oldKey && oldKey !== newKey && isManagedTryoutChokaiObjectKey(oldKey)) {
    bucket.push(oldKey);
  }
}

export async function countTryoutChokaiObjectKeyReferences(objectKey: string): Promise<number> {
  const key = normalizeTryoutChokaiObjectKey(objectKey);
  if (!key) return 0;

  const [setAudio, stimAudio, stimImage, stem, option] = await Promise.all([
    prisma.jlptQuestionSet.count({ where: { chokaiAudioObjectKey: key } }),
    prisma.listeningStimulus.count({ where: { audioObjectKey: key } }),
    prisma.listeningStimulus.count({ where: { imageObjectKey: key } }),
    prisma.jlptQuestion.count({ where: { stemImageObjectKey: key } }),
    prisma.jlptQuestionOption.count({ where: { imageObjectKey: key } }),
  ]);

  return setAudio + stimAudio + stimImage + stem + option;
}

export async function deleteTryoutChokaiObjectKeyIfOrphaned(
  objectKey: string | null | undefined,
): Promise<void> {
  const key = normalizeTryoutChokaiObjectKey(objectKey);
  if (!key || !isManagedTryoutChokaiObjectKey(key)) return;

  const refs = await countTryoutChokaiObjectKeyReferences(key);
  if (refs > 0) return;

  await deleteFromR2(key).catch(() => undefined);
}

export async function deleteTryoutChokaiObjectKeysIfOrphaned(
  keys: Iterable<string | null | undefined>,
): Promise<void> {
  const unique = new Set<string>();
  for (const key of keys) {
    const normalized = normalizeTryoutChokaiObjectKey(key);
    if (normalized && isManagedTryoutChokaiObjectKey(normalized)) {
      unique.add(normalized);
    }
  }

  await Promise.all([...unique].map((k) => deleteTryoutChokaiObjectKeyIfOrphaned(k)));
}

export async function collectQuestionAssetKeys(questionId: string): Promise<string[]> {
  const question = await prisma.jlptQuestion.findUnique({
    where: { id: questionId },
    include: { options: { select: { imageObjectKey: true, imageUrl: true } } },
  });
  if (!question) return [];

  const keys: string[] = [];
  const stem = resolveManagedObjectKey({
    objectKey: question.stemImageObjectKey,
    url: question.stemImageUrl,
  });
  if (stem) keys.push(stem);
  for (const opt of question.options) {
    const k = resolveManagedObjectKey({ objectKey: opt.imageObjectKey, url: opt.imageUrl });
    if (k) keys.push(k);
  }
  return keys;
}

export async function collectStimulusAssetKeys(stimulusId: string): Promise<string[]> {
  const stimulus = await prisma.listeningStimulus.findUnique({
    where: { id: stimulusId },
    include: {
      questions: {
        select: {
          id: true,
          stemImageObjectKey: true,
          stemImageUrl: true,
          options: { select: { imageObjectKey: true, imageUrl: true } },
        },
      },
    },
  });
  if (!stimulus) return [];

  const keys: string[] = [];
  const audio = resolveManagedObjectKey({
    objectKey: stimulus.audioObjectKey,
    url: stimulus.audioUrl,
  });
  if (audio) keys.push(audio);
  const image = resolveManagedObjectKey({
    objectKey: stimulus.imageObjectKey,
    url: stimulus.imageUrl,
  });
  if (image) keys.push(image);

  for (const q of stimulus.questions) {
    const stem = resolveManagedObjectKey({
      objectKey: q.stemImageObjectKey,
      url: q.stemImageUrl,
    });
    if (stem) keys.push(stem);
    for (const opt of q.options) {
      const k = resolveManagedObjectKey({ objectKey: opt.imageObjectKey, url: opt.imageUrl });
      if (k) keys.push(k);
    }
  }
  return keys;
}

/** True when question is not linked to any other set item or session item. */
export async function isQuestionExclusiveToSet(
  questionId: string,
  questionSetId: string,
): Promise<boolean> {
  const [otherSets, sessions] = await Promise.all([
    prisma.jlptQuestionSetItem.count({
      where: { jlptQuestionId: questionId, questionSetId: { not: questionSetId } },
    }),
    prisma.tryoutSessionItem.count({ where: { jlptQuestionId: questionId } }),
  ]);
  return otherSets === 0 && sessions === 0;
}

export async function isStimulusExclusiveToSet(
  stimulusId: string,
  questionSetId: string,
): Promise<boolean> {
  const [otherSets, sessions] = await Promise.all([
    prisma.jlptQuestionSetItem.count({
      where: { listeningStimulusId: stimulusId, questionSetId: { not: questionSetId } },
    }),
    prisma.tryoutSessionItem.count({ where: { listeningStimulusId: stimulusId } }),
  ]);
  return otherSets === 0 && sessions === 0;
}
