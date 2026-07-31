'use client';

import { useEffect, useRef } from 'react';
import {
  isPaymentSseTerminalStatus,
  type PaymentSseEvent,
} from '@/lib/payment/sse-types';

type UsePaymentEventsOptions = {
  paymentId: string | null | undefined;
  enabled?: boolean;
  onEvent: (event: PaymentSseEvent) => void;
};

/**
 * Subscribe to `GET /api/payments/[paymentId]/events` via native EventSource.
 * Closes automatically on terminal payment status or unmount.
 */
export function usePaymentEvents({
  paymentId,
  enabled = true,
  onEvent,
}: UsePaymentEventsOptions): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !paymentId) return;

    const source = new EventSource(`/api/payments/${encodeURIComponent(paymentId)}/events`);
    let closed = false;

    const close = () => {
      if (closed) return;
      closed = true;
      source.close();
    };

    const handlePayment = (message: MessageEvent<string>) => {
      try {
        const event = JSON.parse(message.data) as PaymentSseEvent;
        onEventRef.current(event);
        if (isPaymentSseTerminalStatus(event.status)) {
          close();
        }
      } catch {
        // ignore malformed frames
      }
    };

    source.addEventListener('payment', handlePayment as EventListener);
    source.onerror = () => {
      // EventSource auto-reconnects; leave open until terminal/unmount
    };

    return () => {
      source.removeEventListener('payment', handlePayment as EventListener);
      close();
    };
  }, [paymentId, enabled]);
}
