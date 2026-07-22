import { describe, expect, test } from 'bun:test';
import {
  MARKETING_FOOTER_EXPLORE,
  MARKETING_FOOTER_LEGAL,
  MARKETING_FOOTER_LINKS,
  MARKETING_FOOTER_SUPPORT,
  MARKETING_NAV_LINKS,
  PORTAL_BERITA_URL,
} from '@/features/marketing/components/marketing-nav-links';

describe('marketing-nav-links', () => {
  test('navbar has primary marketing links including placement test and portal', () => {
    expect(MARKETING_NAV_LINKS).toHaveLength(5);
    expect(MARKETING_NAV_LINKS.map((l) => l.href)).toEqual([
      '/tentang',
      '/kursus',
      '/tes-penempatan',
      '/tryout',
      PORTAL_BERITA_URL,
    ]);
  });

  test('footer groups combine into flat footer list', () => {
    const combined = [
      ...MARKETING_FOOTER_EXPLORE,
      ...MARKETING_FOOTER_SUPPORT,
      ...MARKETING_FOOTER_LEGAL,
    ];
    expect(MARKETING_FOOTER_LINKS).toEqual(combined);
    expect(MARKETING_FOOTER_LEGAL.map((l) => l.href)).toEqual([
      '/syarat-ketentuan',
      '/kebijakan-privasi',
    ]);
  });
});
