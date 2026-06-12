import { NextResponse } from 'next/server';
import { createRequestId, jsonApiError, logApiError } from '@/lib/errors/api-error';

export async function POST(req: Request) {
    const requestId = createRequestId();

    try {
        const payload = await req.json();
        console.log(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'jepangku-lms',
                scope: 'webhooks/clerk',
                requestId,
                eventType: payload?.type,
                clerkUserId: payload?.data?.id,
            }),
        );
        return NextResponse.json({ received: true, requestId }, { headers: { 'x-request-id': requestId } });
    } catch (error) {
        logApiError('webhooks/clerk.processing_failed', { requestId }, error);
        return jsonApiError(
            'WEBHOOK_PROCESSING_FAILED',
            'Webhook processing failed',
            500,
            {
                requestId,
                details: {
                    reason: error instanceof Error ? error.message : 'Unknown error',
                },
            },
        );
    }
}
