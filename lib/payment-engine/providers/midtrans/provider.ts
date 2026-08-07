import { getMidtransCoreApi } from '@/lib/midtrans/client';
import { assertMidtransConfig } from '@/lib/midtrans/config';
import { verifyMidtransSignature } from '@/lib/midtrans/payment';
import { buildMidtransChargePayload } from '@/lib/payment-engine/providers/midtrans/charge';
import {
  mapCoreChargeStatus,
  normalizeMidtransChargeToInstructions,
} from '@/lib/payment-engine/providers/midtrans/status-map';
import {
  disableCheckoutMethod,
  isChannelNotActivatedError,
} from '@/lib/payment-engine/registry/methods';
import type { PaymentProvider } from '@/lib/payment-engine/providers/types';
import type {
  CheckoutMethodId,
  ProviderChargeInput,
  ProviderChargeResult,
  ProviderStatusResult,
  ProviderWebhookEvent,
} from '@/lib/payment-engine/types';

function asString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function parseExpiry(raw: Record<string, unknown>): Date | null {
  const expiry = asString(raw.expiry_time);
  if (!expiry) return null;
  const d = new Date(expiry);
  return Number.isNaN(d.getTime()) ? null : d;
}

export class MidtransProvider implements PaymentProvider {
  readonly id = 'midtrans' as const;

  async charge(input: ProviderChargeInput): Promise<ProviderChargeResult> {
    const core = getMidtransCoreApi();
    const payload = buildMidtransChargePayload(input);

    let raw: Record<string, unknown>;
    try {
      raw = (await core.charge(payload)) as Record<string, unknown>;
    } catch (error) {
      if (isChannelNotActivatedError(error)) {
        await disableCheckoutMethod(
          input.methodId,
          error instanceof Error ? error.message : 'Payment channel is not activated.',
        );
        throw new Error(
          'Metode pembayaran ini belum aktif di Midtrans. Pilih metode lain atau hubungi admin.',
        );
      }
      throw error;
    }

    const statusCode = asString(raw.status_code) ?? '';
    if (statusCode && !statusCode.startsWith('2')) {
      const message = asString(raw.status_message) ?? 'Midtrans charge gagal';
      if (statusCode === '402' || isChannelNotActivatedError(message)) {
        await disableCheckoutMethod(
          input.methodId,
          message || 'Payment channel is not activated.',
        );
        throw new Error(
          'Metode pembayaran ini belum aktif di Midtrans. Pilih metode lain atau hubungi admin.',
        );
      }
      throw new Error(message);
    }

    const mapped = mapCoreChargeStatus(raw);
    const instructions = normalizeMidtransChargeToInstructions(
      input.methodId,
      raw,
      input.amountIdr,
    );

    return {
      externalOrderId: asString(raw.order_id) ?? input.externalOrderId,
      externalTransactionId: asString(raw.transaction_id),
      providerPaymentType: asString(raw.payment_type),
      status:
        mapped === 'PAID'
          ? 'PAID'
          : mapped === 'FAILED' || mapped === 'DENIED'
            ? 'FAILED'
            : 'PENDING',
      expiresAt: parseExpiry(raw),
      instructions,
      raw,
    };
  }

  async cancel(externalOrderId: string): Promise<void> {
    const core = getMidtransCoreApi();
    await core.transaction.cancel(externalOrderId);
  }

  async fetchStatus(externalOrderId: string): Promise<ProviderStatusResult> {
    const core = getMidtransCoreApi();
    const raw = (await core.transaction.status(externalOrderId)) as Record<string, unknown>;
    const status = mapCoreChargeStatus(raw);
    return {
      externalOrderId: asString(raw.order_id) ?? externalOrderId,
      externalTransactionId: asString(raw.transaction_id),
      providerPaymentType: asString(raw.payment_type),
      status,
      fraudStatus: asString(raw.fraud_status),
      statusCode: asString(raw.status_code),
      transactionStatus: asString(raw.transaction_status),
      raw,
    };
  }

  async verifyWebhook(request: Request): Promise<ProviderWebhookEvent> {
    const payload = (await request.json()) as {
      order_id?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
    };

    const { serverKey } = assertMidtransConfig();
    if (!payload.order_id || !payload.status_code || !payload.gross_amount || !payload.signature_key) {
      throw new Error('MIDTRANS_PAYLOAD_INVALID');
    }

    if (
      !verifyMidtransSignature({
        orderId: payload.order_id,
        statusCode: payload.status_code,
        grossAmount: payload.gross_amount,
        signatureKey: payload.signature_key,
        serverKey,
      })
    ) {
      throw new Error('MIDTRANS_SIGNATURE_INVALID');
    }

    return { externalOrderId: payload.order_id, notification: payload };
  }
}

let midtransSingleton: MidtransProvider | null = null;

export function getMidtransProvider(): MidtransProvider {
  midtransSingleton ??= new MidtransProvider();
  return midtransSingleton;
}

/** Re-export for charge builders that need method typing. */
export type { CheckoutMethodId };
