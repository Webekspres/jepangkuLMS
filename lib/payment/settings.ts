/**
 * Rekening tujuan transfer manual — konfigurasi via env saat go-live.
 * Semua field WAJIB di-set di production. Tidak ada fallback hardcoded
 * untuk mencegah eksposur data payment palsu (lihat SECURITY_AUDIT.md H-03).
 */
export function getPaymentSettings() {
  const bankName = process.env.PAYMENT_BANK_NAME;
  const accountName = process.env.PAYMENT_ACCOUNT_NAME;
  const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER;

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    (!bankName || !accountName || !accountNumber)
  ) {
    throw new Error(
      'PAYMENT_BANK_NAME, PAYMENT_ACCOUNT_NAME, and PAYMENT_ACCOUNT_NUMBER must be set in production',
    );
  }

  return {
    bankName: bankName ?? 'BCA',
    accountName: accountName ?? 'PT Jepangku Indonesia',
    accountNumber: accountNumber ?? '1234567890',
  } as const;
}


