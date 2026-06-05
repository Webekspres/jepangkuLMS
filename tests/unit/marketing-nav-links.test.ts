import { describe, expect, test } from 'bun:test';
import {
  MARKETING_FOOTER_EXPLORE,
  MARKETING_FOOTER_LEGAL,
  MARKETING_FOOTER_LINKS,
  MARKETING_FOOTER_SUPPORT,
  MARKETING_NAV_LINKS,
} from '@/features/marketing/components/marketing-nav-links';

describe('marketing-nav-links', () => {
  test('navbar has exactly three primary links', () => {
    expect(MARKETING_NAV_LINKS).toHaveLength(3);
    expect(MARKETING_NAV_LINKS.map((l) => l.href)).toEqual(['/tentang', '/kursus', '/tryout']);
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
