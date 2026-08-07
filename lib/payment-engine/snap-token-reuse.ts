/** Local checks before Midtrans Status API — safe for client/unit tests (no server imports). */

export function canReuseSnapTokenLocally(payment: {
  status: string;
  snapToken: string | null;
  expiresAt: Date | null;
}): boolean {
  if (payment.status !== 'PENDING' && payment.status !== 'CHALLENGE') return false;
  if (!payment.snapToken?.trim()) return false;
  if (payment.expiresAt && payment.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

/**
 * Midtrans `transaction_status` still open for Snap reopen.
 * Settlement/capture must NOT reuse — that shows "Payment successful" again.
 */
export function isMidtransTransactionStillOpenForSnap(transactionStatus: string): boolean {
  const status = transactionStatus.trim().toLowerCase();
  if (!status) return false;
  if (
    status === 'settlement' ||
    status === 'capture' ||
    status === 'expire' ||
    status === 'cancel' ||
    status === 'deny' ||
    status === 'failure' ||
    status === 'refund' ||
    status === 'partial_refund'
  ) {
    return false;
  }
  // pending, authorize, challenge, …
  return true;
}
