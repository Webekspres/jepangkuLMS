import type { PaymentStatus } from '@prisma/client';

const TERMINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  'CANCELED',
  'EXPIRED',
  'FAILED',
  'DENIED',
]);

export function isTerminalPaymentStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return TERMINAL_PAYMENT_STATUSES.has(status as PaymentStatus);
}

/** Midtrans payment still awaiting customer / 3DS review. */
export function isOpenMidtransPaymentStatus(status: string | null | undefined): boolean {
  return status === 'PENDING' || status === 'CHALLENGE';
}
