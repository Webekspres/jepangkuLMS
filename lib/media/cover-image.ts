import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  COVER_IMAGE_MAX_BYTES,
  COVER_IMAGE_MIME_TYPES,
} from '@/lib/media/constants';
import { deleteFromR2, extractR2KeyFromUrl, isR2Configured, uploadToR2 } from '@/lib/r2';

export { COVER_IMAGE_MAX_BYTES, COVER_IMAGE_MIME_TYPES };

export type CoverImageKind = 'courses' | 'live-class';

export type ParsedCoverImage = {
  buffer: Buffer;
  mime: string;
  ext: string;
};

/** Map to a fresh string literal so FS paths are not tainted by caller input (CodeQL js/path-injection). */
function coverUploadSubdir(kind: CoverImageKind): 'courses' | 'live-class' {
  switch (kind) {
    case 'courses':
      return 'courses';
    case 'live-class':
      return 'live-class';
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Jenis cover image tidak valid: ${_exhaustive}`);
    }
  }
}

function coverFileExt(ext: string): 'png' | 'webp' | 'jpg' {
  switch (ext) {
    case 'png':
      return 'png';
    case 'webp':
      return 'webp';
    case 'jpg':
      return 'jpg';
    default:
      throw new Error('Ekstensi cover image tidak valid.');
  }
}

function isPathInsideDir(filePath: string, dirPath: string): boolean {
  const resolvedFile = path.resolve(filePath);
  const resolvedDir = path.resolve(dirPath);
  return resolvedFile === resolvedDir || resolvedFile.startsWith(`${resolvedDir}${path.sep}`);
}

export async function parseCoverImageFile(
  formData: FormData,
  fieldName = 'coverImage',
): Promise<ParsedCoverImage | null> {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > COVER_IMAGE_MAX_BYTES) {
    throw new Error('Ukuran gambar maksimal 2 MB.');
  }
  if (!COVER_IMAGE_MIME_TYPES.includes(file.type as (typeof COVER_IMAGE_MIME_TYPES)[number])) {
    throw new Error('Format gambar harus PNG, JPEG, atau WebP.');
  }
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, mime: file.type, ext };
}

async function saveCoverToPublicDir(
  kind: CoverImageKind,
  buffer: Buffer,
  ext: string,
): Promise<string> {
  const subdir = coverUploadSubdir(kind);
  const safeExt = coverFileExt(ext);
  // Filename uses only server-generated entropy — never user slug (breaks path-injection taint).
  const filename = `cover-${Date.now()}-${randomBytes(4).toString('hex')}.${safeExt}`;
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  const dir = path.join(uploadsRoot, subdir);
  const target = path.join(dir, filename);

  if (!isPathInsideDir(target, dir)) {
    throw new Error('Path cover image di luar direktori upload yang diizinkan.');
  }

  await mkdir(dir, { recursive: true });
  await writeFile(target, buffer);
  return `/uploads/${subdir}/${filename}`;
}

/** Upload cover ke R2 (atau public/uploads fallback). Null jika tidak ada file baru. */
export async function resolveCoverImageUrl(options: {
  kind: CoverImageKind;
  slug: string;
  formData: FormData;
  existingUrl?: string | null;
  fieldName?: string;
}): Promise<{ url: string | null; replaced: boolean }> {
  const remove = options.formData.get('removeCover') === 'on';
  const image = await parseCoverImageFile(options.formData, options.fieldName ?? 'coverImage');

  if (remove && !image) {
    return { url: null, replaced: Boolean(options.existingUrl) };
  }
  if (!image) {
    return { url: options.existingUrl ?? null, replaced: false };
  }

  const subdir = coverUploadSubdir(options.kind);
  const safeExt = coverFileExt(image.ext);

  if (isR2Configured()) {
    try {
      const key = `${subdir}/cover-${Date.now()}-${randomBytes(4).toString('hex')}.${safeExt}`;
      const url = await uploadToR2(image.buffer, key, image.mime);
      return { url, replaced: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('Access Denied') && !message.includes('belum dikonfigurasi')) {
        throw error;
      }
    }
  }

  const url = await saveCoverToPublicDir(options.kind, image.buffer, image.ext);
  return { url, replaced: true };
}

/** Hapus objek R2 lama jika URL mengarah ke key managed LMS. */
export async function deletePreviousCoverIfManaged(previousUrl: string | null | undefined) {
  if (!previousUrl || !isR2Configured()) return;
  const key = extractR2KeyFromUrl(previousUrl);
  if (!key) return;
  if (!key.startsWith('courses/') && !key.startsWith('live-class/')) return;
  try {
    await deleteFromR2(key);
  } catch {
    // Non-blocking — file orphaned is acceptable on delete failure.
  }
}
