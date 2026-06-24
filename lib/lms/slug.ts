import type { PrismaClient } from '@prisma/client';
import { slugSchema } from '@/lib/validations/shared';

const MAX_SLUG_LENGTH = 120;
const MAX_SLUG_ATTEMPTS = 999;

/** Lowercase ASCII slug from display title (strips non-Latin). */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_SLUG_LENGTH);
}

/** Title → slug with fallback when title is non-Latin or empty. */
export function slugBaseFromTitle(title: string, fallbackPrefix: string, order?: number): string {
  const fromTitle = slugifyTitle(title);
  if (fromTitle.length > 0) return fromTitle;
  if (order != null) return `${fallbackPrefix}-${order}`;
  return fallbackPrefix;
}

export function withSlugSuffix(base: string, attempt: number): string {
  if (attempt <= 1) return base.slice(0, MAX_SLUG_LENGTH);
  const suffix = `-${attempt}`;
  return `${base.slice(0, MAX_SLUG_LENGTH - suffix.length)}${suffix}`;
}

/** In-memory dedupe (CSV preview / tree build). */
export function dedupeSlugInSet(base: string, used: Set<string>): string {
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = withSlugSuffix(base, attempt);
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  throw new Error(`Tidak dapat membuat slug unik untuk "${base}".`);
}

export function resolveSlugInput(
  input: string | undefined,
  title: string,
  fallbackPrefix: string,
  order?: number,
): string {
  const trimmed = input?.trim();
  if (trimmed) {
    const parsed = slugSchema.safeParse(trimmed);
    return parsed.success ? parsed.data : trimmed;
  }
  return slugBaseFromTitle(title, fallbackPrefix, order);
}

type PrismaSlugClient = Pick<PrismaClient, 'course' | 'module' | 'lesson'>;

export async function ensureUniqueCourseSlug(
  client: PrismaSlugClient,
  base: string,
  excludeId?: string,
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = withSlugSuffix(base, attempt);
    const existing = await client.course.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
  }
  throw new Error(`Tidak dapat membuat slug kursus unik untuk "${base}".`);
}

export async function ensureUniqueModuleSlug(
  client: PrismaSlugClient,
  courseId: string,
  base: string,
  excludeId?: string,
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = withSlugSuffix(base, attempt);
    const existing = await client.module.findUnique({
      where: { courseId_slug: { courseId, slug: candidate } },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
  }
  throw new Error(`Tidak dapat membuat slug modul unik untuk "${base}".`);
}

export async function ensureUniqueLessonSlug(
  client: PrismaSlugClient,
  base: string,
  excludeId?: string,
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = withSlugSuffix(base, attempt);
    const existing = await client.lesson.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
  }
  throw new Error(`Tidak dapat membuat slug pelajaran unik untuk "${base}".`);
}
