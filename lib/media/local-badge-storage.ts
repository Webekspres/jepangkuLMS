import 'server-only';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BADGE_DIR = path.join(process.cwd(), 'public', 'badges');

/** Simpan gambar badge ke `public/badges/` — fallback saat R2 tidak tersedia (dev/VPS). */
export async function saveBadgeToPublicDir(
  code: string,
  buffer: Buffer,
  ext: string,
): Promise<string> {
  const safeCode = code.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const filename = `${safeCode}.${ext}`;
  await mkdir(BADGE_DIR, { recursive: true });
  await writeFile(path.join(BADGE_DIR, filename), buffer);
  return `/badges/${filename}`;
}

export function isStaticBadgeUrl(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith('/badges/'));
}

export function parseStaticImageUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('/badges/')) return null;
  if (trimmed.includes('..')) return null;
  return trimmed;
}
