import { afterEach, describe, expect, test } from 'bun:test';
import {
  assertMidtransConfig,
  getCheckoutMode,
  isMidtransEnabled,
} from '@/lib/midtrans/config';
import { isChannelNotActivatedError } from '@/lib/payment-engine/registry/methods-catalog';

describe('midtrans dual-mode config', () => {
  const prev = {
    server: process.env.MIDTRANS_SERVER_KEY,
    client: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    mode: process.env.PAYMENT_CHECKOUT_MODE,
    prod: process.env.MIDTRANS_IS_PRODUCTION,
  };

  afterEach(() => {
    restore('MIDTRANS_SERVER_KEY', prev.server);
    restore('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY', prev.client);
    restore('PAYMENT_CHECKOUT_MODE', prev.mode);
    restore('MIDTRANS_IS_PRODUCTION', prev.prod);
  });

  function restore(key: string, value: string | undefined) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  test('isMidtransEnabled is true only when server key is set', () => {
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(isMidtransEnabled()).toBe(false);
    process.env.MIDTRANS_SERVER_KEY = '  SB-Mid-server-x  ';
    expect(isMidtransEnabled()).toBe(true);
  });

  test('getCheckoutMode defaults to core and respects snap', () => {
    process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-x';
    delete process.env.PAYMENT_CHECKOUT_MODE;
    expect(getCheckoutMode()).toBe('core');
    process.env.PAYMENT_CHECKOUT_MODE = 'snap';
    expect(getCheckoutMode()).toBe('snap');
  });

  test('assertMidtransConfig rejects sandbox server key in production', () => {
    process.env.MIDTRANS_IS_PRODUCTION = 'true';
    process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-x';
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY = 'Mid-client-x';
    process.env.PAYMENT_CHECKOUT_MODE = 'snap';
    expect(() => assertMidtransConfig({ requireClientKey: true })).toThrow(/sandbox/i);
  });

  test('assertMidtransConfig requires client key for snap', () => {
    process.env.MIDTRANS_IS_PRODUCTION = 'false';
    process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-x';
    delete process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    delete process.env.MIDTRANS_CLIENT_KEY;
    process.env.PAYMENT_CHECKOUT_MODE = 'snap';
    expect(() => assertMidtransConfig({ requireClientKey: true })).toThrow(/Client Key/i);
  });

  test('switching mode is env-only (no schema implication in config)', () => {
    process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-x';
    process.env.PAYMENT_CHECKOUT_MODE = 'snap';
    expect(getCheckoutMode()).toBe('snap');
    process.env.PAYMENT_CHECKOUT_MODE = 'core';
    expect(getCheckoutMode()).toBe('core');
  });
});

describe('channel not activated detection', () => {
  test('matches Midtrans 402 messaging', () => {
    expect(isChannelNotActivatedError(new Error('Payment channel is not activated.'))).toBe(true);
    expect(isChannelNotActivatedError(new Error('HTTP 402'))).toBe(true);
    expect(isChannelNotActivatedError(new Error('Insufficient funds'))).toBe(false);
  });
});

describe('Snap token local reuse', () => {
  test('rejects terminal status, missing token, and expired', async () => {
    const { canReuseSnapTokenLocally } = await import(
      '@/lib/payment-engine/snap-token-reuse'
    );
    expect(
      canReuseSnapTokenLocally({
        status: 'PAID',
        snapToken: 'tok',
        expiresAt: null,
      }),
    ).toBe(false);
    expect(
      canReuseSnapTokenLocally({
        status: 'PENDING',
        snapToken: null,
        expiresAt: null,
      }),
    ).toBe(false);
    expect(
      canReuseSnapTokenLocally({
        status: 'PENDING',
        snapToken: 'tok',
        expiresAt: new Date(Date.now() - 1000),
      }),
    ).toBe(false);
    expect(
      canReuseSnapTokenLocally({
        status: 'PENDING',
        snapToken: 'tok',
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).toBe(true);
  });

  test('settlement/capture are not open for Snap reopen', async () => {
    const { isMidtransTransactionStillOpenForSnap } = await import(
      '@/lib/payment-engine/snap-token-reuse'
    );
    expect(isMidtransTransactionStillOpenForSnap('settlement')).toBe(false);
    expect(isMidtransTransactionStillOpenForSnap('capture')).toBe(false);
    expect(isMidtransTransactionStillOpenForSnap('pending')).toBe(true);
    expect(isMidtransTransactionStillOpenForSnap('expire')).toBe(false);
  });
});
