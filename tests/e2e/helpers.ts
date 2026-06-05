import type { Page } from '@playwright/test';

/** Tunggu splash screen selesai (~1.4s) pada full page load. */
export async function waitForAppReady(page: Page) {
  const splash = page.locator('[role="progressbar"][aria-label*="Memuat JepangKu"]');
  const count = await splash.count();
  if (count > 0) {
    await splash.waitFor({ state: 'detached', timeout: 15_000 });
  }
}

export async function gotoAndReady(page: Page, path: string) {
  await page.goto(path);
  await waitForAppReady(page);
}
