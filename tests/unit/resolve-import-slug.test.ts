import { describe, expect, test } from 'bun:test';
import { resolveImportSlug } from '@/features/admin-cms/lib/import-framework/resolve-import-slug';

describe('resolve-import-slug', () => {
  test('generates slug from title when sheet omits slug column', () => {
    expect(resolveImportSlug('Kursus Contoh JLPT N5', 'kursus-contoh-n5')).toBe('kursus-contoh-jlpt-n5');
  });

  test('prefers explicit slug when legacy workbook still provides it', () => {
    expect(resolveImportSlug('Judul Apa Saja', 'ext-1', 'slug-kustom')).toBe('slug-kustom');
  });

  test('falls back to external id when title is empty', () => {
    expect(resolveImportSlug('', 'modul-1')).toBe('modul-1');
  });
});
