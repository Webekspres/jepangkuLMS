/** Konteks HTTP ke layanan luar (Core backend, dll.) — tetap JSON-friendly di file log. */
export type UpstreamLogFields = {
  upstream?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  code?: string;
  durationMs?: number;
  responseBody?: string;
};

const DEFAULT_UPSTREAM = 'core-backend';
const MAX_RESPONSE_BODY = 500;

export function upstreamLogContext(
  fields: UpstreamLogFields,
): UpstreamLogFields & { upstream: string } {
  const upstream = fields.upstream ?? DEFAULT_UPSTREAM;
  return {
    upstream,
    ...(fields.method ? { method: fields.method } : {}),
    ...(fields.path ? { path: fields.path } : {}),
    ...(typeof fields.statusCode === 'number' ? { statusCode: fields.statusCode } : {}),
    ...(fields.code ? { code: fields.code } : {}),
    ...(typeof fields.durationMs === 'number' ? { durationMs: fields.durationMs } : {}),
    ...(fields.responseBody
      ? { responseBody: fields.responseBody.slice(0, MAX_RESPONSE_BODY) }
      : {}),
  };
}

/** Satu baris ringkas untuk terminal dev — status code & sumber tetap terlihat. */
export function formatUpstreamSummary(
  fields: UpstreamLogFields,
  message: string,
): string {
  const upstream = fields.upstream ?? DEFAULT_UPSTREAM;
  const parts: string[] = [`[${upstream}]`];

  if (fields.method && fields.path) {
    parts.push(`${fields.method} ${fields.path}`);
  } else if (fields.path) {
    parts.push(fields.path);
  }

  if (typeof fields.statusCode === 'number') {
    parts.push(`→ ${fields.statusCode}`);
  }

  if (fields.code) {
    parts.push(`(${fields.code})`);
  }

  if (typeof fields.durationMs === 'number') {
    parts.push(`${fields.durationMs}ms`);
  }

  return `${parts.join(' ')} — ${message}`;
}
