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
  slug: string,
  buffer: Buffer,
  ext: string,
): Promise<string> {
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'cover';
  const filename = `${safeSlug}-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${kind}/${filename}`;
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

  if (isR2Configured()) {
    try {
      const key = `${options.kind}/${options.slug}-${Date.now()}.${image.ext}`;
      const url = await uploadToR2(image.buffer, key, image.mime);
      return { url, replaced: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('Access Denied') && !message.includes('belum dikonfigurasi')) {
        throw error;
      }
    }
  }

  const url = await saveCoverToPublicDir(options.kind, options.slug, image.buffer, image.ext);
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
