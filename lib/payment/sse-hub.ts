import type { PaymentSseEvent } from '@/lib/payment/sse-types';
import { loggers } from '@/lib/logger';

type PaymentListener = (event: PaymentSseEvent) => void;

const hubLog = loggers.api.child({ module: 'payment-sse-hub' });

const listenersByPaymentId = new Map<string, Set<PaymentListener>>();

/** Prevents Redis pub/sub echo from double-firing local listeners on the publisher process. */
const PROCESS_ORIGIN = `lms-sse-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

type BunRedisPubSub = {
  ping(): Promise<string>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string, listener: (message: string, channel: string) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  close?: () => void;
};

type RedisEnvelope = PaymentSseEvent & { _origin?: string };

const redisPrefix = process.env.REDIS_KEY_PREFIX?.trim() || 'jepangku:lms:';
const redisChannel = (paymentId: string) => `${redisPrefix}payment:${paymentId}`;

let publisher: BunRedisPubSub | null = null;
let subscriber: BunRedisPubSub | null = null;
let redisStatus: 'off' | 'connecting' | 'ready' | 'unavailable' = 'off';
const redisSubscribedChannels = new Set<string>();

function redisEnabled(): boolean {
  return process.env.REDIS_ENABLED === 'true' && Boolean(process.env.REDIS_URL?.trim());
}

async function ensureRedis(): Promise<boolean> {
  if (!redisEnabled()) {
    redisStatus = 'off';
    return false;
  }
  if (redisStatus === 'ready' && publisher && subscriber) return true;
  if (redisStatus === 'unavailable') return false;

  redisStatus = 'connecting';
  try {
    const { RedisClient } = await import('bun');
    const url = process.env.REDIS_URL!.trim();
    publisher = new RedisClient(url, { autoReconnect: true }) as unknown as BunRedisPubSub;
    subscriber = new RedisClient(url, { autoReconnect: true }) as unknown as BunRedisPubSub;
    await Promise.all([publisher.ping(), subscriber.ping()]);
    redisStatus = 'ready';
    return true;
  } catch (error) {
    redisStatus = 'unavailable';
    publisher = null;
    subscriber = null;
    hubLog.warn({ error: error instanceof Error ? error.message : error }, 'Payment SSE Redis unavailable — in-memory only');
    return false;
  }
}

function fanOutLocal(event: PaymentSseEvent): void {
  const set = listenersByPaymentId.get(event.paymentId);
  if (!set || set.size === 0) return;
  for (const listener of set) {
    try {
      listener(event);
    } catch (error) {
      hubLog.warn(
        { paymentId: event.paymentId, error: error instanceof Error ? error.message : error },
        'Payment SSE listener threw',
      );
    }
  }
}

async function ensureRedisChannel(paymentId: string): Promise<void> {
  if (!(await ensureRedis()) || !subscriber) return;
  const channel = redisChannel(paymentId);
  if (redisSubscribedChannels.has(channel)) return;

  await subscriber.subscribe(channel, (message) => {
    try {
      const envelope = JSON.parse(message) as RedisEnvelope;
      if (!envelope?.paymentId) return;
      if (envelope._origin === PROCESS_ORIGIN) return;
      const { _origin: _ignored, ...event } = envelope;
      fanOutLocal(event);
    } catch {
      hubLog.warn({ channel }, 'Invalid payment SSE Redis payload');
    }
  });
  redisSubscribedChannels.add(channel);
}

async function maybeUnsubscribeRedisChannel(paymentId: string): Promise<void> {
  if (!subscriber || redisStatus !== 'ready') return;
  const remaining = listenersByPaymentId.get(paymentId)?.size ?? 0;
  if (remaining > 0) return;
  const channel = redisChannel(paymentId);
  if (!redisSubscribedChannels.has(channel)) return;
  try {
    await subscriber.unsubscribe(channel);
  } catch {
    // ignore — channel may already be gone
  }
  redisSubscribedChannels.delete(channel);
}

/** Subscribe to payment status updates for one Payment.id. Returns unsubscribe. */
export function subscribePaymentEvents(
  paymentId: string,
  listener: PaymentListener,
): () => void {
  let set = listenersByPaymentId.get(paymentId);
  if (!set) {
    set = new Set();
    listenersByPaymentId.set(paymentId, set);
  }
  set.add(listener);

  void ensureRedisChannel(paymentId);

  return () => {
    const current = listenersByPaymentId.get(paymentId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      listenersByPaymentId.delete(paymentId);
      void maybeUnsubscribeRedisChannel(paymentId);
    }
  };
}

/** Publish after DB persist. Never throw to callers — Redis/local fan-out best-effort. */
export async function publishPaymentEvent(event: PaymentSseEvent): Promise<void> {
  try {
    fanOutLocal(event);

    if (await ensureRedis()) {
      const envelope: RedisEnvelope = { ...event, _origin: PROCESS_ORIGIN };
      await publisher!.publish(redisChannel(event.paymentId), JSON.stringify(envelope));
    }
  } catch (error) {
    hubLog.warn(
      { paymentId: event.paymentId, error: error instanceof Error ? error.message : error },
      'publishPaymentEvent failed (non-fatal)',
    );
  }
}
