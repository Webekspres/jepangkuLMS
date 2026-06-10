import { CoreTokenExchangeError, exchangeClerkSessionForCoreJwt } from './exchange-token';

const WEBHOOK_SYNC_DELAYS_MS = [0, 1200, 2400, 3600, 5000];

function isRetryableExchangeError(error: CoreTokenExchangeError): boolean {
  if (error.code === 'USER_NOT_FOUND') return true;
  if (error.code === 'INTERNAL_ERROR') return true;
  return error.status >= 500;
}

/** Core butuh user dari webhook Clerk — retry jika belum tersinkron atau Core sementara error */
export async function exchangeClerkSessionForCoreJwtWithRetry(clerkSessionToken: string) {
  let lastError: CoreTokenExchangeError | undefined;

  for (const delayMs of WEBHOOK_SYNC_DELAYS_MS) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    try {
      return await exchangeClerkSessionForCoreJwt(clerkSessionToken);
    } catch (error) {
      if (error instanceof CoreTokenExchangeError && isRetryableExchangeError(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw (
    lastError ??
    new CoreTokenExchangeError(
      'User belum tersinkron di Core.',
      404,
      'USER_NOT_FOUND',
    )
  );
}
