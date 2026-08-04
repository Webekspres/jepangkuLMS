/**
 * Payment runtime settings.
 * Modes via PAYMENT_PROVIDER:
 * - midtrans → gateway checkout + webhook settle
 * - manual → student bank transfer bridge (admin Setujui)
 * - unset/other → unavailable (WhatsApp consult + CMS grant only)
 */
export type PaymentProviderMode = 'midtrans' | 'manual' | 'unavailable';

export function isManualPaymentEnabled(): boolean {
  return process.env.PAYMENT_PROVIDER?.toLowerCase() === 'manual';
}

export function getPaymentSettings() {
  const raw = process.env.PAYMENT_PROVIDER?.toLowerCase();
  const provider: PaymentProviderMode =
    raw === 'midtrans' ? 'midtrans' : raw === 'manual' ? 'manual' : 'unavailable';

  const bankName = process.env.PAYMENT_BANK_NAME?.trim() ?? '';
  const accountName = process.env.PAYMENT_ACCOUNT_NAME?.trim() ?? '';
  const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER?.trim() ?? '';

  if (
    provider === 'manual' &&
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    (!bankName || !accountName || !accountNumber)
  ) {
    throw new Error(
      'PAYMENT_BANK_NAME, PAYMENT_ACCOUNT_NAME, and PAYMENT_ACCOUNT_NUMBER must be set when PAYMENT_PROVIDER=manual',
    );
  }

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
    bankName:
      provider === 'manual'
        ? bankName || (process.env.NODE_ENV === 'production' ? '' : 'BCA')
        : bankName,
    accountName:
      provider === 'manual'
        ? accountName || (process.env.NODE_ENV === 'production' ? '' : 'Jepang Versi Kamu PT')
        : accountName,
    accountNumber:
      provider === 'manual'
        ? accountNumber || (process.env.NODE_ENV === 'production' ? '' : '3199995678')
        : accountNumber,
    midtransClientKey,
    midtransSnapUrl:
      provider === 'midtrans'
        ? isProduction
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js'
        : null,
  } as const;
}
