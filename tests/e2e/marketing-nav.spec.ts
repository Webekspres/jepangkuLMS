import { test, expect } from '@playwright/test';
import { gotoAndReady } from './helpers';

test.describe('Marketing navigation', () => {
  test('navbar shows only primary links', async ({ page }) => {
    await gotoAndReady(page, '/kursus');

    const nav = page.getByRole('navigation').first();
    await expect(nav.getByRole('link', { name: 'Tentang Kami' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Kursus' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Tryout JLPT' })).toBeVisible();

    await expect(nav.getByRole('link', { name: 'Kontak' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Cara Belajar' })).toHaveCount(0);
  });

  test('footer includes explore, support, and legal links', async ({ page }) => {
    await gotoAndReady(page, '/tentang');

    const footer = page.getByRole('contentinfo');
    for (const label of [
      'Tentang Kami',
      'Kursus',
      'JLPT Try Out',
      'Cara Belajar',
      'Kontak',
      'Syarat & Ketentuan',
      'Kebijakan Privasi',
    ]) {
      await expect(footer.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('cara-belajar does not highlight navbar kursus link', async ({ page }) => {
    await gotoAndReady(page, '/cara-belajar');

    const kursusLink = page.getByRole('navigation').first().getByRole('link', { name: 'Kursus' });
    await expect(kursusLink).toHaveClass(/text-muted-foreground/);
  });
});
