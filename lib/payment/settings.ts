/** Rekening tujuan transfer manual — konfigurasi via env saat go-live. */
export const PAYMENT_SETTINGS = {
  bankName: process.env.PAYMENT_BANK_NAME ?? 'BCA',
  accountName: process.env.PAYMENT_ACCOUNT_NAME ?? 'PT Jepangku Indonesia',
  accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER ?? '1234567890',
} as const;
