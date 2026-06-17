import { getCoreApiBaseUrl } from './client';
import { loggers, logUpstreamFailure } from '@/lib/logger';

const coreLog = loggers.core;

type CoreTokenSuccess = {
  token: string;
  expiresIn: string;
};

type CoreErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class CoreTokenExchangeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'CoreTokenExchangeError';
  }
}

export async function exchangeClerkSessionForCoreJwt(
  clerkSessionToken: string,
): Promise<CoreTokenSuccess> {
  const baseUrl = getCoreApiBaseUrl();
  if (!baseUrl) {
    coreLog.error('Core token exchange aborted — JEPANGKU_CORE_API_URL not set');
    throw new CoreTokenExchangeError(
      'JEPANGKU_CORE_API_URL belum dikonfigurasi.',
      503,
      'CORE_NOT_CONFIGURED',
    );
  }

  const response = await fetch(`${baseUrl}/api/v1/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clerkSessionToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Jepangku-Application': 'LMS',
    },
    body: JSON.stringify({ application: 'LMS' }),
    cache: 'no-store',
  });

  if (!response.ok) {
    let code: string | undefined;
    let message = `Core token exchange failed (${response.status})`;

    try {
      const body = (await response.json()) as CoreErrorBody;
      code = body.error?.code;
      message = body.error?.message ?? message;
    } catch {
      // ignore parse errors
    }

    const failure = logUpstreamFailure(
      {
        method: 'POST',
        path: '/api/v1/auth/token',
        statusCode: response.status,
        code,
      },
      `Core JWT token exchange rejected: ${message}`,
    );
    coreLog.warn(failure.context, failure.summary);
    throw new CoreTokenExchangeError(message, response.status, code);
  }

  const { context, summary } = logUpstreamFailure(
    { method: 'POST', path: '/api/v1/auth/token', statusCode: response.status },
    'Core JWT token exchange succeeded',
  );
  coreLog.info(context, summary);
  return (await response.json()) as CoreTokenSuccess;
}
