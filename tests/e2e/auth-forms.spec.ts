import { test, expect } from '@playwright/test';
import { gotoAndReady } from './helpers';

test.describe('Auth form shells', () => {
  test('sign-in shows validation when fields are empty', async ({ page }) => {
    await gotoAndReady(page, '/sign-in');
    await page.getByRole('button', { name: /Masuk ke Dashboard/i }).click();
    await expect(page.getByText(/Email dan password tidak boleh kosong/i)).toBeVisible();
  });

  test('sign-up shows validation when fields are empty', async ({ page }) => {
    await gotoAndReady(page, '/sign-up');
    await page.getByRole('button', { name: /Daftar Sekarang/i }).click();
    await expect(page.getByText(/Semua field wajib diisi/i)).toBeVisible();
  });

  test('sign-up links to legal pages', async ({ page }) => {
    await gotoAndReady(page, '/sign-up');
    await expect(page.getByRole('link', { name: 'Syarat & Ketentuan' })).toHaveAttribute(
      'href',
      '/syarat-ketentuan',
    );
    await expect(page.getByRole('link', { name: 'Kebijakan Privasi' })).toHaveAttribute(
      'href',
      '/kebijakan-privasi',
    );
  });
});
