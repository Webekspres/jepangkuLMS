import { generateSlug } from '@/lib/string-helpers';

/** Slug from explicit value, else title (CMS default), else external id. */
export function resolveImportSlug(
  title: string,
  externalId: string,
  explicitSlug?: string | null,
): string {
  const trimmed = explicitSlug?.trim();
  if (trimmed) return trimmed;

  const fromTitle = generateSlug(title);
  if (fromTitle) return fromTitle;

  return generateSlug(externalId) || externalId;
}
