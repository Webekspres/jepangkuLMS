import crypto from 'node:crypto';
import type { PaymentStatus } from '@prisma/client';

export function buildMidtransOrderId(enrollmentId: string): string {
  return `lms-${enrollmentId.slice(0, 8)}-${Date.now()}`;
}

export function verifyMidtransSignature(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  serverKey: string;
}): boolean {
  const expected = crypto
    .createHash('sha512')
    .update(input.orderId + input.statusCode + input.grossAmount + input.serverKey)
    .digest('hex');

  return expected === input.signatureKey;
}

export function mapMidtransTransactionToPaymentStatus(input: {
  transactionStatus?: string | null;
  fraudStatus?: string | null;
}): PaymentStatus {
  if (input.transactionStatus === 'capture') {
    return input.fraudStatus === 'challenge' ? 'CHALLENGE' : 'PAID';
  }
  if (input.transactionStatus === 'settlement') return 'PAID';
  if (input.transactionStatus === 'pending') return 'PENDING';
  if (input.transactionStatus === 'deny') return 'DENIED';
  if (input.transactionStatus === 'expire') return 'EXPIRED';
  if (input.transactionStatus === 'cancel') return 'CANCELED';
  return 'FAILED';
}
