import { NextResponse } from 'next/server';
import { loggers, serializeError } from '@/lib/logger';

const webhookLog = loggers.webhook.child({ route: 'POST /api/webhooks/clerk' });

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType =
      typeof payload === 'object' && payload !== null && 'type' in payload
        ? String((payload as { type?: string }).type)
        : 'unknown';

    webhookLog.info(
      {
        eventType,
        userId:
          typeof payload === 'object' && payload !== null && 'data' in payload
            ? (payload as { data?: { id?: string } }).data?.id
            : undefined,
      },
      'Clerk webhook received (LMS stub — sync handled by Core)',
    );
    return NextResponse.json({ received: true });
  } catch (error) {
    webhookLog.error({ ...serializeError(error) }, 'Clerk webhook processing failed');
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
