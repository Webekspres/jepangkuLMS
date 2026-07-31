import type { CheckoutMethodId, PaymentInstructions } from '@/lib/payment-engine/types';
import { mapMidtransTransactionToPaymentStatus } from '@/lib/midtrans/payment';

function asString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function findAction(
  actions: unknown,
  name: string,
): { url?: string } | undefined {
  if (!Array.isArray(actions)) return undefined;
  return actions.find((a) => a && typeof a === 'object' && (a as { name?: string }).name === name) as
    | { url?: string }
    | undefined;
}

function expiryFromResponse(raw: Record<string, unknown>): string | null {
  const expiryTime = asString(raw.expiry_time);
  return expiryTime;
}

/**
 * Map Midtrans Core charge / status payload → normalized PaymentInstructions.
 */
export function normalizeMidtransChargeToInstructions(
  methodId: CheckoutMethodId,
  raw: Record<string, unknown>,
  amountFallback: number,
): PaymentInstructions {
  const amountIdr = Math.round(asNumber(raw.gross_amount, amountFallback));
  const expiresAt = expiryFromResponse(raw);

  switch (methodId) {
    case 'qris': {
      const qrUrl =
        asString(raw.qr_string) ??
        findAction(raw.actions, 'generate-qr-code')?.url ??
        findAction(raw.actions, 'generate-qr-code-v2')?.url ??
        '';
      // Prefer action URL (image); qr_string may be payload text — UI can render as img src when http
      const actionQr = findAction(raw.actions, 'generate-qr-code')?.url;
      return {
        kind: 'qris',
        qrUrl: actionQr ?? (qrUrl.startsWith('http') ? qrUrl : actionQr ?? qrUrl),
        amountIdr,
        expiresAt,
      };
    }
    case 'gopay':
    case 'shopeepay': {
      const deepLink =
        findAction(raw.actions, 'deeplink-redirect')?.url ??
        findAction(raw.actions, 'mobile-deeplink-checkout-url')?.url ??
        null;
      const qrUrl = findAction(raw.actions, 'generate-qr-code')?.url ?? null;
      return { kind: 'ewallet', deepLink, qrUrl, amountIdr, expiresAt };
    }
    case 'va_bca':
    case 'va_bni':
    case 'va_bri': {
      const bank = methodId.replace('va_', '');
      const vaNumbers = raw.va_numbers;
      let vaNumber = '';
      if (Array.isArray(vaNumbers) && vaNumbers[0] && typeof vaNumbers[0] === 'object') {
        vaNumber = asString((vaNumbers[0] as { va_number?: string }).va_number) ?? '';
      }
      if (!vaNumber) vaNumber = asString(raw.permata_va_number) ?? '';
      return { kind: 'va', bank, vaNumber, amountIdr, expiresAt };
    }
    case 'va_mandiri': {
      const billKey = asString(raw.bill_key) ?? '';
      const billerCode = asString(raw.biller_code) ?? '';
      const vaNumber = billerCode ? `${billerCode}-${billKey}` : billKey;
      return { kind: 'va', bank: 'mandiri', vaNumber, amountIdr, expiresAt };
    }
    case 'indomaret':
    case 'alfamart': {
      return {
        kind: 'cstore',
        store: methodId,
        paymentCode: asString(raw.payment_code) ?? '',
        amountIdr,
        expiresAt,
      };
    }
    default: {
      const _exhaustive: never = methodId;
      throw new Error(`Unsupported method for normalize: ${_exhaustive}`);
    }
  }
}

export function mapCoreChargeStatus(raw: Record<string, unknown>) {
  return mapMidtransTransactionToPaymentStatus({
    transactionStatus: asString(raw.transaction_status),
    fraudStatus: asString(raw.fraud_status),
  });
}
