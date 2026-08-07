import { afterEach, describe, expect, test } from 'bun:test';
import { isMidtransEnabled } from '@/lib/midtrans/config';
import { isChannelNotActivatedError } from '@/lib/payment-engine/registry/methods';

describe('midtrans core-only config', () => {
  const prev = process.env.MIDTRANS_SERVER_KEY;

  afterEach(() => {
    if (prev === undefined) delete process.env.MIDTRANS_SERVER_KEY;
    else process.env.MIDTRANS_SERVER_KEY = prev;
  });

  test('isMidtransEnabled is true only when server key is set', () => {
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(isMidtransEnabled()).toBe(false);

    process.env.MIDTRANS_SERVER_KEY = '  Mid-server-x  ';
    expect(isMidtransEnabled()).toBe(true);
  });
});

describe('channel not activated detection', () => {
  test('matches Midtrans 402 messaging', () => {
    expect(isChannelNotActivatedError(new Error('Payment channel is not activated.'))).toBe(true);
    expect(isChannelNotActivatedError(new Error('HTTP 402'))).toBe(true);
    expect(isChannelNotActivatedError(new Error('Insufficient funds'))).toBe(false);
  });
});
