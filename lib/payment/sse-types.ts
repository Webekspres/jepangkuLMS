import type { EnrollmentStatus, EnrollmentType, PaymentStatus } from '@prisma/client';

/** Payload streamed on SSE `event: payment` and published on the payment hub. */
export type PaymentSseEvent = {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  enrollmentStatus: EnrollmentStatus;
  enrollmentId: string;
  productType: EnrollmentType;
  redirectPath: string | null;
};

export const PAYMENT_SSE_TERMINAL_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  'PAID',
  'DENIED',
  'EXPIRED',
  'CANCELED',
  'FAILED',
]);

export function isPaymentSseTerminalStatus(status: PaymentStatus): boolean {
  return PAYMENT_SSE_TERMINAL_STATUSES.has(status);
}
