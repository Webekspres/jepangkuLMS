/** Format harga Rupiah — contoh: 299000 → "Rp 299.000" */
export function formatIdr(amount: number): string {
  if (amount <= 0) return 'Gratis';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function isFreeCourse(priceIdr: number): boolean {
  return priceIdr <= 0;
}

/**
 * Format angka untuk input mata uang — hanya digit + pemisah ribuan titik.
 * Contoh: "1000000" atau 1000000 → "1.000.000". Kosong → "".
 */
export function formatRupiahInput(value: string | number): string {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

/** Kebalikan dari formatRupiahInput — "1.000.000" → 1000000 (integer). */
export function parseRupiahInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}
