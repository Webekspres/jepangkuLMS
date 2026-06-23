import { NextResponse } from 'next/server';
import { createRequestId, jsonApiError, logApiError } from '@/lib/errors/api-error';
import { loggers } from '@/lib/logger';

const webhookLog = loggers.webhook.child({ route: 'POST /api/webhooks/clerk' });

export async function POST(req: Request) {
    const requestId = createRequestId();

    try {
        const payload = await req.json();
        const eventType =
            typeof payload === 'object' && payload !== null && 'type' in payload
                ? String((payload as { type?: string }).type)
                : 'unknown';

        webhookLog.info(
            {
                eventType,
                requestId,
                userId:
                    typeof payload === 'object' && payload !== null && 'data' in payload
                        ? (payload as { data?: { id?: string } }).data?.id
                        : undefined,
            },
            'Clerk webhook received (LMS stub — sync handled by Core)',
        );
        return NextResponse.json(
            { received: true, requestId },
            { headers: { 'x-request-id': requestId } },
        );
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
