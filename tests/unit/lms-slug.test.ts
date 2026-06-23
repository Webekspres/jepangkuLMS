import { describe, expect, test } from 'bun:test';
import {
  dedupeSlugInSet,
  slugBaseFromTitle,
  slugifyTitle,
  withSlugSuffix,
} from '@/lib/lms/slug';

describe('lms-slug', () => {
  test('slugifyTitle normalizes latin text', () => {
    expect(slugifyTitle('JLPT N5 — Kursus Lengkap')).toBe('jlpt-n5-kursus-lengkap');
  });

  test('slugifyTitle strips japanese characters', () => {
    expect(slugifyTitle('ひらがなの基礎')).toBe('');
  });

  test('slugBaseFromTitle falls back with order', () => {
    expect(slugBaseFromTitle('ひらがな', 'pelajaran', 3)).toBe('pelajaran-3');
    expect(slugBaseFromTitle('Modul 1', 'modul', 1)).toBe('modul-1');
  });

  test('withSlugSuffix appends numeric suffix from attempt 2', () => {
    expect(withSlugSuffix('kursus-demo', 1)).toBe('kursus-demo');
    expect(withSlugSuffix('kursus-demo', 2)).toBe('kursus-demo-2');
  });

  test('dedupeSlugInSet allocates suffix on collision', () => {
    const used = new Set<string>(['pengenalan']);
    expect(dedupeSlugInSet('pengenalan', used)).toBe('pengenalan-2');
    expect(used.has('pengenalan-2')).toBe(true);
  });
});
