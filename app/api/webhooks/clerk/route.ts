import { after } from 'next/server';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { userAnchorCreateData } from '@/lib/auth/sync-user-anchor';
import { dispatchWelcomeEmail, parseClerkUserCreatedEvent } from '@/lib/email';
import { prisma } from '@/lib/prisma';
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

        let evt: unknown;
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

        const userId =
            typeof evt === 'object' && evt !== null && 'data' in evt
                ? (evt as { data?: { id?: string } }).data?.id
                : undefined;

        webhookLog.info(
            { eventType, requestId, userId },
            'Clerk webhook received',
        );

        const welcomePayload = parseClerkUserCreatedEvent(evt);
        if (welcomePayload) {
            after(async () => {
                dispatchWelcomeEmail({
                    email: welcomePayload.email,
                    name: welcomePayload.name,
                    userId: welcomePayload.userId,
                });

                await prisma.user.upsert({
                    where: { id: welcomePayload.userId },
                    create: userAnchorCreateData(welcomePayload.userId, {
                        ssoEmail: welcomePayload.email,
                        ssoDisplayName: welcomePayload.name,
                    }),
                    update: {
                        ssoEmail: welcomePayload.email,
                        ssoDisplayName: welcomePayload.name,
                    },
                });
            });
        }

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
