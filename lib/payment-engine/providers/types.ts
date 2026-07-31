import type {
  PaymentProviderId,
  ProviderChargeInput,
  ProviderChargeResult,
  ProviderStatusResult,
  ProviderWebhookEvent,
} from '@/lib/payment-engine/types';

/**
 * PSP port — UI and PaymentService depend on this, not Midtrans SDK types.
 * Phase 1: only MidtransProvider implements this.
 */
export interface PaymentProvider {
  readonly id: PaymentProviderId;

  charge(input: ProviderChargeInput): Promise<ProviderChargeResult>;

  cancel?(externalOrderId: string): Promise<void>;

  fetchStatus(externalOrderId: string): Promise<ProviderStatusResult>;

  verifyWebhook(request: Request): Promise<ProviderWebhookEvent>;
}
