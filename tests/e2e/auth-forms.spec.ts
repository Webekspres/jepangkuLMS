import { test, expect } from '@playwright/test';
import { gotoAndReady } from './helpers';

test.describe('Auth form shells', () => {
  test('sign-in shows branded shell and Clerk form', async ({ page }) => {
    await gotoAndReady(page, '/sign-in');
    await expect(page.getByRole('heading', { name: 'Selamat Datang!' })).toBeVisible();
    await expect(page.locator('.cl-signIn-root, .cl-rootBox').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('sign-up shows branded shell and Clerk form', async ({ page }) => {
    await gotoAndReady(page, '/sign-up');
    await expect(page.getByRole('heading', { name: 'Buat Akun Baru' })).toBeVisible();
    await expect(page.locator('.cl-signUp-root, .cl-rootBox').first()).toBeVisible({
      timeout: 15_000,
    });
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
