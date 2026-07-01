import { isCronEnabled, verifyCronRequest } from '@/lib/api/cron-auth';
import { retryPendingCoreXp } from '@/lib/lms/core-xp-retry';
import { loggers } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'POST /api/core/retry-xp' });

/**
 * Drain the Core XP outbox (re-dispatch PENDING `LmsXpEvent` to Core).
 * Server-to-server only — guard with `LMS_CRON_SECRET`. Idempotent & safe to
 * schedule (e.g. every 5 min) or call manually after Core downtime.
 */
export async function POST(request: Request) {
  if (!isCronEnabled()) {
    apiLog.warn('Retry-xp rejected — LMS_CRON_SECRET not set');
    return Response.json({ error: 'Cron endpoint disabled' }, { status: 503 });
  }

  if (!verifyCronRequest(request)) {
    apiLog.warn('Retry-xp rejected — invalid cron secret');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await retryPendingCoreXp({ limit: 200 });
  apiLog.info(result, 'Core XP outbox drain (cron)');

  return Response.json({ ok: true, ...result });
}
