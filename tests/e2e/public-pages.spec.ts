import { test, expect } from '@playwright/test';
import { gotoAndReady } from './helpers';

const PUBLIC_PAGES: { path: string; heading: RegExp }[] = [
  { path: '/', heading: /Kursus bahasa Jepang/i },
  { path: '/kursus', heading: /Temukan Kursus/i },
  { path: '/kursus/jlpt-n5-kursus-lengkap', heading: /JLPT N5/i },
  { path: '/tryout', heading: /Simulasi Ujian/i },
  { path: '/tentang', heading: /Tentang JepangKu/i },
  { path: '/cara-belajar', heading: /Cara Belajar di JepangKu/i },
  { path: '/hubungi', heading: /Hubungi Kami/i },
  { path: '/syarat-ketentuan', heading: /Syarat & Ketentuan/i },
  { path: '/kebijakan-privasi', heading: /Kebijakan Privasi/i },
];

test.describe('Public marketing pages', () => {
  for (const { path, heading } of PUBLIC_PAGES) {
    test(`loads ${path}`, async ({ page }) => {
      await gotoAndReady(page, path);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    });
  }
});
