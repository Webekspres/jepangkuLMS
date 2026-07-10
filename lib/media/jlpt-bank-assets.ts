/**
 * JLPT bank R2 keys — permanent assets under jlpt-bank/, never sessionCode.
 * ZIP import is transport only; these keys are the SSOT after upload.
 */
import { createHash } from 'crypto';
import { isR2Configured, uploadToR2 } from '@/lib/r2';

export const JLPT_BANK_AUDIO_MAX_BYTES = 30 * 1024 * 1024;
export const JLPT_BANK_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp3']);
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

export type JlptBankAssetKind = 'audio' | 'image' | 'option-image' | 'stem-image';

export function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 16);
}

function sanitizeCodeSegment(code: string): string {
  return code.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'asset';
}

function extFromName(filename: string, fallback: string): string {
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? `.${m[1]}` : fallback;
}

export function buildJlptBankObjectKey(input: {
  level: string;
  kind: JlptBankAssetKind;
  code: string;
  contentHash: string;
  originalFilename: string;
}): string {
  const level = input.level.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'NX';
  const kindFolder =
    input.kind === 'audio'
      ? 'audio'
      : input.kind === 'option-image'
        ? 'option-images'
        : input.kind === 'stem-image'
          ? 'stem-images'
          : 'images';
  const code = sanitizeCodeSegment(input.code);
  const ext =
    input.kind === 'audio'
      ? '.mp3'
      : extFromName(input.originalFilename, '.png');
  return `jlpt-bank/${level}/${kindFolder}/${code}/${input.contentHash}${ext}`;
}

export function resolveJlptBankAudioMime(file: { type: string; name: string }): string | null {
  const type = file.type.trim().toLowerCase();
  if (AUDIO_TYPES.has(type)) return 'audio/mpeg';
  if (file.name.toLowerCase().endsWith('.mp3')) return 'audio/mpeg';
  return null;
}

export function resolveJlptBankImageMime(file: { type: string; name: string }): string | null {
  const type = file.type.trim().toLowerCase();
  if (IMAGE_TYPES.has(type)) {
    if (type === 'image/jpg') return 'image/jpeg';
    return type;
  }
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return null;
}

export async function uploadJlptBankAsset(input: {
  buffer: Buffer;
  level: string;
  kind: JlptBankAssetKind;
  code: string;
  originalFilename: string;
  contentType: string;
}): Promise<{ objectKey: string; publicUrl: string; contentHash: string }> {
  if (!isR2Configured()) {
    throw new Error(
      'R2 belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, dan R2_PUBLIC_URL di .env',
    );
  }

  const contentHash = hashBuffer(input.buffer);
  const objectKey = buildJlptBankObjectKey({
    level: input.level,
    kind: input.kind,
    code: input.code,
    contentHash,
    originalFilename: input.originalFilename,
  });
  const publicUrl = await uploadToR2(input.buffer, objectKey, input.contentType);
  return { objectKey, publicUrl, contentHash };
}
