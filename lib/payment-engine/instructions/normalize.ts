import { normalizeMidtransChargeToInstructions } from '@/lib/payment-engine/providers/midtrans/status-map';
import type { CheckoutMethodId, PaymentInstructions } from '@/lib/payment-engine/types';

/** Normalize provider payload → PaymentInstructions (Midtrans Phase 1). */
export function normalizePaymentInstructions(
  methodId: CheckoutMethodId,
  raw: unknown,
  amountFallback: number,
): PaymentInstructions {
  return normalizeMidtransChargeToInstructions(
    methodId,
    (raw ?? {}) as Record<string, unknown>,
    amountFallback,
  );
}
