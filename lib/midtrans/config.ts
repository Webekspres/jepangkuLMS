export function isMidtransEnabled(): boolean {
  return process.env.PAYMENT_PROVIDER?.toLowerCase() === 'midtrans';
}

export function getMidtransConfig() {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim() ?? '';
  const clientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ??
    process.env.MIDTRANS_CLIENT_KEY?.trim() ??
    '';

  return {
    isProduction,
    serverKey,
    clientKey,
  };
}

export function assertMidtransConfig() {
  const config = getMidtransConfig();
  if (!config.serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi');
  }
  if (!config.clientKey) {
    throw new Error('MIDTRANS_CLIENT_KEY belum dikonfigurasi');
  }
  return config;
}
