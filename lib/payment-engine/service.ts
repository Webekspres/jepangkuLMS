import type { PaymentProvider } from '@/lib/payment-engine/providers/types';
import type {
  CheckoutContext,
  CheckoutMethodId,
  PaymentProviderId,
} from '@/lib/payment-engine/types';
import { isCheckoutMethodAvailable } from '@/lib/payment-engine/registry/methods';
import { getMidtransProvider } from '@/lib/payment-engine/providers/midtrans/provider';

export function getPaymentProvider(id: PaymentProviderId = 'midtrans'): PaymentProvider {
  if (id === 'midtrans') return getMidtransProvider();
  throw new Error(`Payment provider not configured: ${id}`);
}

export function assertCheckoutReadyToCharge(
  context: CheckoutContext,
  methodId: CheckoutMethodId,
): void {
  if (context.pricing.totalIdr <= 0) {
    throw new Error('Checkout total must be greater than zero for paid charge');
  }
  if (context.providerId !== 'midtrans') {
    throw new Error(`Unsupported payment provider: ${context.providerId}`);
  }
  if (!isCheckoutMethodAvailable(methodId)) {
    throw new Error(`Payment method unavailable: ${methodId}`);
  }
}

export function withCheckoutMethod(
  context: CheckoutContext,
  methodId: CheckoutMethodId,
): CheckoutContext {
  assertCheckoutReadyToCharge(context, methodId);
  return { ...context, methodId };
}
