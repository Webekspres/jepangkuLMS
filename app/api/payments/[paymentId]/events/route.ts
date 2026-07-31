import { auth } from '@clerk/nextjs/server';
import { buildPaymentSseEvent } from '@/lib/payment/sse-event';
import { subscribePaymentEvents } from '@/lib/payment/sse-hub';
import type { PaymentSseEvent } from '@/lib/payment/sse-types';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_MS = 15_000;

function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function encodeComment(text: string): string {
  return `: ${text}\n\n`;
}

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { paymentId } = await context.params;
  if (!paymentId?.trim()) {
    return new Response(JSON.stringify({ error: 'paymentId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      enrollment: {
        select: {
          id: true,
          userId: true,
          status: true,
          type: true,
          course: { select: { slug: true } },
        },
      },
    },
  });

  if (!payment) {
    return new Response(JSON.stringify({ error: 'Payment not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (payment.enrollment.userId !== userId) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const snapshot = buildPaymentSseEvent({
    paymentId: payment.id,
    orderId: payment.orderId,
    status: payment.status,
    enrollmentId: payment.enrollment.id,
    enrollmentStatus: payment.enrollment.status,
    productType: payment.enrollment.type,
    courseSlug: payment.enrollment.course?.slug ?? null,
  });

  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let unsubscribe: (() => void) | null = null;

      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = null;
        unsubscribe?.();
        unsubscribe = null;
        request.signal.removeEventListener('abort', cleanup);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      safeEnqueue(encodeSse('payment', snapshot));

      unsubscribe = subscribePaymentEvents(paymentId, (event: PaymentSseEvent) => {
        safeEnqueue(encodeSse('payment', event));
      });

      heartbeat = setInterval(() => {
        safeEnqueue(encodeComment(`heartbeat ${Date.now()}`));
      }, HEARTBEAT_MS);

      request.signal.addEventListener('abort', cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
