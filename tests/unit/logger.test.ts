import { describe, expect, it } from 'bun:test';
import { CoreTokenExchangeError } from '@/lib/core/exchange-token';
import {
  formatErrorSummary,
  formatUpstreamSummary,
  serializeError,
  upstreamLogContext,
} from '@/lib/logger';

describe('logger upstream formatting', () => {
  it('formats Core backend failure with status code', () => {
    expect(
      formatUpstreamSummary(
        {
          method: 'GET',
          path: '/api/v1/users/me',
          statusCode: 502,
          code: 'SERVICE_UNAVAILABLE',
          durationMs: 124,
        },
        'Core API request failed: service unavailable',
      ),
    ).toBe(
      '[core-backend] GET /api/v1/users/me → 502 (SERVICE_UNAVAILABLE) 124ms — Core API request failed: service unavailable',
    );
  });

  it('builds structured context for JSON file logs', () => {
    expect(
      upstreamLogContext({
        method: 'POST',
        path: '/api/v1/auth/token',
        statusCode: 401,
        code: 'INVALID_SESSION',
      }),
    ).toEqual({
      upstream: 'core-backend',
      method: 'POST',
      path: '/api/v1/auth/token',
      statusCode: 401,
      code: 'INVALID_SESSION',
    });
  });

  it('serializes CoreTokenExchangeError with status and code', () => {
    const error = new CoreTokenExchangeError('Invalid session', 401, 'INVALID_SESSION');
    expect(serializeError(error)).toMatchObject({
      statusCode: 401,
      code: 'INVALID_SESSION',
      err: {
        type: 'CoreTokenExchangeError',
        message: 'Invalid session',
        statusCode: 401,
        code: 'INVALID_SESSION',
      },
    });
  });

  it('formats local LMS errors separately from upstream', () => {
    expect(formatErrorSummary(new Error('Database timeout'), 'jepangku-lms')).toBe(
      '[jepangku-lms] Error — Database timeout',
    );
  });
});
