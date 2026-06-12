import { formatUpstreamSummary, upstreamLogContext, type UpstreamLogFields } from './upstream-log';

type ErrorRecord = {
  type: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  upstream?: string;
};

function readErrorMeta(error: object): Pick<ErrorRecord, 'code' | 'statusCode' | 'upstream'> {
  const record = error as {
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
    upstream?: unknown;
  };

  const statusCode =
    typeof record.statusCode === 'number'
      ? record.statusCode
      : typeof record.status === 'number'
        ? record.status
        : undefined;

  return {
    ...(typeof record.code === 'string' ? { code: record.code } : {}),
    ...(typeof statusCode === 'number' ? { statusCode } : {}),
    ...(typeof record.upstream === 'string' ? { upstream: record.upstream } : {}),
  };
}

/** Normalisasi error untuk field `err` Pino (JSON-friendly). */
export function serializeError(error: unknown): { err: ErrorRecord } & Partial<ErrorRecord> {
  if (error instanceof Error) {
    const meta = readErrorMeta(error);
    return {
      err: {
        type: error.name,
        message: error.message,
        ...(error.stack ? { stack: error.stack } : {}),
        ...meta,
      },
      ...meta,
    };
  }

  if (error && typeof error === 'object') {
    const meta = readErrorMeta(error);
    const message =
      'message' in error && typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : String(error);

    return {
      err: {
        type: 'UnknownError',
        message,
        ...meta,
      },
      ...meta,
    };
  }

  return {
    err: {
      type: 'UnknownError',
      message: String(error),
    },
  };
}

/** Ringkas error lokal LMS untuk baris terminal. */
export function formatErrorSummary(error: unknown, source = 'jepangku-lms'): string {
  const { err, statusCode, code } = serializeError(error);
  const parts = [`[${source}]`, err.type];

  if (typeof statusCode === 'number') {
    parts.push(`→ ${statusCode}`);
  }

  if (code) {
    parts.push(`(${code})`);
  }

  parts.push(`— ${err.message}`);
  return parts.join(' ');
}

export function logUpstreamFailure(
  fields: UpstreamLogFields,
  message: string,
): { context: ReturnType<typeof upstreamLogContext>; summary: string } {
  const context = upstreamLogContext(fields);
  const summary = formatUpstreamSummary(context, message);
  return { context, summary };
}
