import { createRequire } from 'node:module';
import { assertMidtransConfig } from '@/lib/midtrans/config';

const require = createRequire(import.meta.url);
const midtransClient = require('midtrans-client') as {
  Snap: new (options: {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }) => {
    createTransaction: (payload: unknown) => Promise<{ token: string; redirect_url: string }>;
    transaction: {
      status: (orderId: string) => Promise<Record<string, unknown>>;
      cancel: (orderId: string) => Promise<Record<string, unknown>>;
    };
  };
  CoreApi: new (options: {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }) => {
    charge: (payload: unknown) => Promise<Record<string, unknown>>;
    transaction: {
      status: (orderId: string) => Promise<Record<string, unknown>>;
      cancel: (orderId: string) => Promise<Record<string, unknown>>;
    };
  };
};

export function getMidtransSnapClient() {
  const config = assertMidtransConfig();
  return new midtransClient.Snap(config);
}

export function getMidtransCoreApi() {
  const config = assertMidtransConfig();
  return new midtransClient.CoreApi(config);
}
