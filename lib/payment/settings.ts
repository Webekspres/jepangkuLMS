/**
 * Payment runtime settings.
 * Modes via PAYMENT_PROVIDER:
 * - midtrans → gateway checkout + webhook settle
 * - unset/other → unavailable (WhatsApp consult + CMS grant only)
 */
export type PaymentProviderMode = 'midtrans' | 'unavailable';

export function getPaymentSettings() {
  const raw = process.env.PAYMENT_PROVIDER?.toLowerCase();
  const provider: PaymentProviderMode = raw === 'midtrans' ? 'midtrans' : 'unavailable';

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
    midtransClientKey,
    midtransSnapUrl:
      provider === 'midtrans'
        ? isProduction
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js'
        : null,
  } as const;
}
