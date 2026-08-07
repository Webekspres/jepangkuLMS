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
  getCatalogMethod,
  getCheckoutMethod,
  isChannelNotActivatedError,
  listCheckoutMethodGroups,
  METHOD_CATALOG,
  paymentMethodIconSrc,
  type PaymentMethodGroup,
  type PaymentMethodGroupId,
} from '@/lib/payment-engine/registry/methods-catalog';

export {
  disableCheckoutMethod,
  isCheckoutMethodAvailable,
  listCheckoutMethods,
} from '@/lib/payment-engine/registry/methods';


export {
  assertCheckoutReadyToCharge,
  getPaymentProvider,
  withCheckoutMethod,
} from '@/lib/payment-engine/service';

export { getMidtransProvider, MidtransProvider } from '@/lib/payment-engine/providers/midtrans/provider';

export { chargeCoursePayment, chargeProductPayment, parsePaymentInstructions } from '@/lib/payment-engine/charge-product';

export { chargeSnapProductPayment, isReusableSnapPayment, canReuseSnapTokenLocally } from '@/lib/payment-engine/charge-snap-product';

export { applyProviderPaymentEvent } from '@/lib/payment-engine/status/apply-event';

export {
  checkoutPathFor,
  resolveCourseCheckout,
  resolveLiveClassCheckout,
  resolveProductCheckout,
  resolveTryoutCheckout,
} from '@/lib/payment-engine/products';

