export function isMidtransEnabled(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY?.trim());
}

export function getMidtransConfig() {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim() ?? '';

  return {
    isProduction,
    serverKey,
  };
}

export function assertMidtransConfig() {
  const config = getMidtransConfig();
  if (!config.serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi');
  }
  return config;
}
