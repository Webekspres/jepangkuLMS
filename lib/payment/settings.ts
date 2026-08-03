/**
 * Payment runtime settings.
 * Paid student checkout is Midtrans-only. Bank transfer UX has been retired.
 * CMS "grant enrollment" remains separate from this settings object.
 */
export function getPaymentSettings() {
  const bankName = process.env.PAYMENT_BANK_NAME;
  const accountName = process.env.PAYMENT_ACCOUNT_NAME;
  const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER;
  const provider =
    process.env.PAYMENT_PROVIDER?.toLowerCase() === 'midtrans' ? 'midtrans' : 'unavailable';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const midtransClientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? process.env.MIDTRANS_CLIENT_KEY ?? null;
  /** `core` = custom checkout (default when Midtrans); `snap` = legacy popup */
  const checkoutMode =
    provider === 'midtrans'
      ? process.env.PAYMENT_CHECKOUT_MODE?.toLowerCase() === 'snap'
        ? 'snap'
        : 'core'
      : 'unavailable';

  return {
    provider,
    checkoutMode,
    /** @deprecated Bank transfer retired — kept for any leftover copy, not required. */
    bankName: bankName ?? '',
    accountName: accountName ?? '',
    accountNumber: accountNumber ?? '',
    midtransClientKey,
    midtransSnapUrl:
      provider === 'midtrans'
        ? isProduction
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js'
        : null,
  } as const;
}
