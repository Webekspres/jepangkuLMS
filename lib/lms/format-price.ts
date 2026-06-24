/** Format harga Rupiah — contoh: 299000 → "Rp 299.000" */
export function formatIdr(amount: number): string {
  if (amount <= 0) return 'Gratis';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function isFreeCourse(priceIdr: number): boolean {
  return priceIdr <= 0;
}
