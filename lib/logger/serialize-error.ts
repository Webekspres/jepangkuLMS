/** Normalisasi error untuk field `err` Pino (JSON-friendly). */
export function serializeError(error: unknown): {
  err: {
    type: string;
    message: string;
    stack?: string;
    code?: string;
    status?: number;
  };
} {
  if (error instanceof Error) {
    const extra = error as Error & { code?: string; status?: number };
    return {
      err: {
        type: error.name,
        message: error.message,
        ...(error.stack ? { stack: error.stack } : {}),
        ...(extra.code ? { code: extra.code } : {}),
        ...(typeof extra.status === 'number' ? { status: extra.status } : {}),
      },
    };
  }

  return {
    err: {
      type: 'UnknownError',
      message: String(error),
    },
  };
}
