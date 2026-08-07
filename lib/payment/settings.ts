import { isMidtransEnabled } from '@/lib/midtrans/config';

/**
 * Payment runtime settings.
 * Midtrans is available when MIDTRANS_SERVER_KEY is set; otherwise consult + CMS grant only.
 */
export type PaymentProviderMode = 'midtrans' | 'unavailable';

export function getPaymentSettings() {
  const provider: PaymentProviderMode = isMidtransEnabled() ? 'midtrans' : 'unavailable';

  return {
    provider,
  } as const;
}
