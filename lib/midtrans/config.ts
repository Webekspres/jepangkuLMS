export type CheckoutMode = 'snap' | 'core';

export function isMidtransEnabled(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY?.trim());
}

/** Default `core` unless explicitly set to `snap` (interim Production until Core API activated). */
export function getCheckoutMode(): CheckoutMode {
  if (!isMidtransEnabled()) return 'core';
  return process.env.PAYMENT_CHECKOUT_MODE?.toLowerCase() === 'snap' ? 'snap' : 'core';
}

function readClientKey(): string {
  return (
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ??
    process.env.MIDTRANS_CLIENT_KEY?.trim() ??
    ''
  );
}

function assertKeyMatchesEnvironment(input: {
  isProduction: boolean;
  serverKey: string;
  clientKey: string;
  requireClientKey: boolean;
}): void {
  const { isProduction, serverKey, clientKey, requireClientKey } = input;
  const serverIsSandbox = serverKey.startsWith('SB-');
  const serverIsProd = serverKey.startsWith('Mid-');

  if (isProduction) {
    if (serverIsSandbox) {
      throw new Error(
        'MIDTRANS_IS_PRODUCTION=true but MIDTRANS_SERVER_KEY looks like sandbox (SB-…).',
      );
    }
    if (requireClientKey && clientKey.startsWith('SB-')) {
      throw new Error(
        'MIDTRANS_IS_PRODUCTION=true but Client Key looks like sandbox (SB-…).',
      );
    }
  } else {
    if (serverIsProd && !serverIsSandbox) {
      throw new Error(
        'MIDTRANS_IS_PRODUCTION=false but MIDTRANS_SERVER_KEY looks like production (Mid-…).',
      );
    }
    if (requireClientKey && clientKey.startsWith('Mid-') && !clientKey.startsWith('SB-')) {
      throw new Error(
        'MIDTRANS_IS_PRODUCTION=false but Client Key looks like production (Mid-…).',
      );
    }
  }
}

export function getMidtransConfig() {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim() ?? '';
  const clientKey = readClientKey();
  const checkoutMode = getCheckoutMode();

  return {
    isProduction,
    serverKey,
    clientKey,
    checkoutMode,
    snapJsUrl: isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js',
  };
}

export function assertMidtransConfig(options?: { requireClientKey?: boolean }) {
  const config = getMidtransConfig();
  if (!config.serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi');
  }

  const requireClientKey =
    options?.requireClientKey ?? config.checkoutMode === 'snap';

  if (requireClientKey && !config.clientKey) {
    throw new Error(
      'MIDTRANS Client Key belum dikonfigurasi (NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) — wajib untuk mode Snap',
    );
  }

  assertKeyMatchesEnvironment({
    isProduction: config.isProduction,
    serverKey: config.serverKey,
    clientKey: config.clientKey,
    requireClientKey,
  });

  return config;
}
