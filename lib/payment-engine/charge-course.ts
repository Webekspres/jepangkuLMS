/**
 * @deprecated Import from `@/lib/payment-engine/charge-product` instead.
 * Kept so existing imports keep working during cutover.
 */
export {
  chargeCoursePayment,
  chargeProductPayment,
  parsePaymentInstructions,
  type ChargeProductResult as ChargeCourseResult,
} from '@/lib/payment-engine/charge-product';
