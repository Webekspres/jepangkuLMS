import {
  getCheckoutMode,
  getMidtransConfig,
  isMidtransEnabled,
} from '@/lib/midtrans/config';

/**
 * Payment runtime settings.
 * Midtrans is available when MIDTRANS_SERVER_KEY is set.
 * `checkoutMode` is `snap` | `core` (env PAYMENT_CHECKOUT_MODE).
 */
export type PaymentProviderMode = 'midtrans' | 'unavailable';

export function getPaymentSettings() {
  const enabled = isMidtransEnabled();
  const config = getMidtransConfig();
  const checkoutMode = enabled ? getCheckoutMode() : ('unavailable' as const);

  return {
    provider: (enabled ? 'midtrans' : 'unavailable') as PaymentProviderMode,
    checkoutMode,
    midtransClientKey: checkoutMode === 'snap' ? config.clientKey || null : null,
    midtransSnapUrl: checkoutMode === 'snap' ? config.snapJsUrl : null,
  } as const;
}
