/**
 * Hierarchical R2 logical keys for Choukai paket assets.
 * Actual bucket keys are `lms/` + these (see uploadToR2).
 *
 * Layout:
 *   tryouts/chokai/{code}--{setId}/audio/{uuid}-master.mp3
 *   tryouts/chokai/{code}--{setId}/mondai-{n}/images/{uuid}.{ext}
 */
import { randomUUID } from 'crypto';

export const TRYOUT_CHOKAI_KEY_PREFIX = 'tryouts/chokai/';

export function sanitizePaketChokaiCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'paket';
}

export function buildPaketChokaiRoot(code: string, setId: string): string {
  const safeCode = sanitizePaketChokaiCode(code);
  const safeId = setId.replace(/[^a-zA-Z0-9_-]+/g, '').slice(0, 36) || 'set';
  return `${TRYOUT_CHOKAI_KEY_PREFIX}${safeCode}--${safeId}`;
}

export function buildPaketChokaiMasterAudioKey(
  code: string,
  setId: string,
  originalName: string,
): string {
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = base || 'master';
  return `${buildPaketChokaiRoot(code, setId)}/audio/${randomUUID()}-${suffix}.mp3`;
}

export function buildPaketChokaiMondaiImageKey(
  code: string,
  setId: string,
  mondaiOrder: number,
  filename: string,
): string {
  const order = Math.max(1, Math.trunc(mondaiOrder) || 1);
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? ext : 'png';
  return `${buildPaketChokaiRoot(code, setId)}/mondai-${order}/images/${randomUUID()}.${safeExt}`;
}
