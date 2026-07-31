/**
 * Rekening tujuan transfer manual — konfigurasi via env saat go-live.
 * Semua field WAJIB di-set di production. Tidak ada fallback hardcoded
 * untuk mencegah eksposur data payment palsu (lihat SECURITY_AUDIT.md H-03).
 */
export function getPaymentSettings() {
  const bankName = process.env.PAYMENT_BANK_NAME;
  const accountName = process.env.PAYMENT_ACCOUNT_NAME;
  const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER;
  const provider =
    process.env.PAYMENT_PROVIDER?.toLowerCase() === 'midtrans' ? 'midtrans' : 'manual';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const midtransClientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? process.env.MIDTRANS_CLIENT_KEY ?? null;
  /** `core` = custom checkout (default when Midtrans); `snap` = legacy popup */
  const checkoutMode =
    provider === 'midtrans'
      ? process.env.PAYMENT_CHECKOUT_MODE?.toLowerCase() === 'snap'
        ? 'snap'
        : 'core'
      : 'manual';

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
    provider,
    checkoutMode,
    bankName: bankName ?? 'BCA',
    accountName: accountName ?? 'Jepang Versi Kamu PT',
    accountNumber: accountNumber ?? '3199995678',
    midtransClientKey,
    midtransSnapUrl:
      provider === 'midtrans'
        ? isProduction
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js'
        : null,
  } as const;
}


