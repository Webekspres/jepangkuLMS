import { NextResponse } from 'next/server';
import { createRequestId, jsonApiError, logApiError } from '@/lib/errors/api-error';
import { loggers } from '@/lib/logger';
import { getPaymentProvider } from '@/lib/payment-engine/service';
import { applyProviderPaymentEvent } from '@/lib/payment-engine/status/apply-event';

const webhookLog = loggers.webhook.child({ route: 'POST /api/webhooks/midtrans' });

export async function POST(req: Request) {
  const requestId = createRequestId();

  try {
    const provider = getPaymentProvider('midtrans');
    let event;
    try {
      event = await provider.verifyWebhook(req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'invalid';
      if (message === 'MIDTRANS_PAYLOAD_INVALID') {
        return jsonApiError('MIDTRANS_PAYLOAD_INVALID', 'Payload notification Midtrans tidak lengkap', 400, {
          requestId,
        });
      }
      if (message === 'MIDTRANS_SIGNATURE_INVALID') {
        return jsonApiError('MIDTRANS_SIGNATURE_INVALID', 'Signature Midtrans tidak valid', 401, {
          requestId,
        });
      }
      throw error;
    }

    let result;
    try {
      result = await applyProviderPaymentEvent({ externalOrderId: event.externalOrderId });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'MIDTRANS_PAYMENT_NOT_FOUND') {
        return jsonApiError('MIDTRANS_PAYMENT_NOT_FOUND', 'Payment tidak ditemukan', 404, { requestId });
      }
      throw error;
    }

    webhookLog.info(
      { requestId, orderId: event.externalOrderId, paymentId: result.paymentId, status: result.status },
      'Midtrans notification processed',
    );

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    logApiError('webhooks/midtrans.processing_failed', { requestId }, error);
    return jsonApiError('MIDTRANS_WEBHOOK_FAILED', 'Webhook Midtrans gagal diproses', 500, {
      requestId,
    });
  }
}
