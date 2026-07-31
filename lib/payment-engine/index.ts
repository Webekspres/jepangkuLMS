/**
 * Payment engine — provider-agnostic orchestration for LMS checkout.
 * ADR: docs/PAYMENT_MODEL.md
 */

export type {
  CheckoutContext,
  CheckoutMethodId,
  CheckoutProductType,
  InstructionKind,
  PaymentInstructions,
  PaymentMethodCategory,
  PaymentMethodMeta,
  PaymentProviderId,
  ProviderChargeInput,
  ProviderChargeResult,
  ProviderStatusResult,
  ProviderWebhookEvent,
  SupportedPlatform,
} from '@/lib/payment-engine/types';

export type { PaymentProvider } from '@/lib/payment-engine/providers/types';

export {
  getCheckoutMethod,
  isCheckoutMethodAvailable,
  listCheckoutMethods,
} from '@/lib/payment-engine/registry/methods';

export {
  assertCheckoutReadyToCharge,
  getPaymentProvider,
  withCheckoutMethod,
} from '@/lib/payment-engine/service';

export { getMidtransProvider, MidtransProvider } from '@/lib/payment-engine/providers/midtrans/provider';

export { chargeCoursePayment, parsePaymentInstructions } from '@/lib/payment-engine/charge-course';

export { applyProviderPaymentEvent } from '@/lib/payment-engine/status/apply-event';
