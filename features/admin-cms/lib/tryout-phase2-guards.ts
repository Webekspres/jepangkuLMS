/**
 * Phase 2 cutover helpers — block legacy session-owned Question writes
 * and freeze composition on published (active) sessions.
 */

export const LEGACY_TRYOUT_WRITE_DISABLED_MESSAGE =
  'Penulisan soal tryout ke model lama (Question per sesi) sudah dinonaktifkan. ' +
  'Gunakan Bank Soal + Paket Soal (/admin/tryout/paket).';

export const LEGACY_TRYOUT_IMPORT_DISABLED_MESSAGE =
  'Import tryout terikat sesi sudah dinonaktifkan. ' +
  'Impor ZIP paket di /admin/tryout/paket/import.';

export function compositionFrozenMessage(sessionTitle?: string): string {
  const label = sessionTitle ? `"${sessionTitle}"` : 'Sesi ini';
  return (
    `${label} sedang aktif (dipublikasikan). Nonaktifkan sesi dulu untuk mengubah paket, ` +
    'atau duplikat Paket Soal dengan kode baru.'
  );
}
