import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createRequestId, jsonApiError, logApiError } from '@/lib/errors/api-error';
import { loggers } from '@/lib/logger';

const webhookLog = loggers.webhook.child({ route: 'POST /api/webhooks/clerk' });

export async function POST(req: Request) {
    const requestId = createRequestId();

    try {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            webhookLog.error('CLERK_WEBHOOK_SECRET not configured — rejecting webhook');
            return jsonApiError('WEBHOOK_CONFIG_MISSING', 'Webhook secret not configured', 500, { requestId });
        }

        const wh = new Webhook(webhookSecret);
        const svixId = req.headers.get('svix-id');
        const svixTimestamp = req.headers.get('svix-timestamp');
        const svixSignature = req.headers.get('svix-signature');

        if (!svixId || !svixTimestamp || !svixSignature) {
            webhookLog.warn({ requestId }, 'Missing Svix headers — rejecting');
            return jsonApiError('WEBHOOK_MISSING_HEADERS', 'Missing webhook signature headers', 400, { requestId });
        }

        const payload = await req.text();

        let evt;
        try {
            evt = wh.verify(payload, {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': svixSignature,
            });
        } catch (err) {
            webhookLog.warn({ requestId, error: err instanceof Error ? err.message : err }, 'Svix signature verification failed');
            return jsonApiError('WEBHOOK_SIGNATURE_INVALID', 'Invalid webhook signature', 401, { requestId });
        }

        const eventType = typeof evt === 'object' && evt !== null && 'type' in evt
            ? String((evt as { type?: string }).type)
            : 'unknown';

        webhookLog.info(
            {
                eventType,
                requestId,
                userId:
                    typeof evt === 'object' && evt !== null && 'data' in evt
                        ? (evt as { data?: { id?: string } }).data?.id
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
