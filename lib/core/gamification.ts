import { getCoreApiBaseUrl } from './client';
import { CORE_APPLICATION_LMS, getCoreServiceToken, isCoreAwardConfigured } from './config';
import type { LmsActivityKind } from './activity-map';
import { buildLmsIdempotencyKey, toCoreActivityType } from './activity-map';
import { loggers, logUpstreamFailure } from '@/lib/logger';

const coreLog = loggers.core;

export type CoreAwardXpResponse = {
  idempotent: boolean;
  user: {
    totalXp: number;
    currentLevel: number;
  };
};

export type AwardLmsXpInput = {
  userId: string;
  kind: LmsActivityKind;
  xpGained: number;
  sourceRefId?: string;
  idempotencyKey?: string;
};

/**
 * Hasil eksplisit award Core — TIDAK PERNAH throw, supaya pemanggil bisa
 * memutuskan outbox/retry tanpa meledakkan Server Action.
 *
 * - `synced`     : Core menerima (baru) atau replay idempoten — keduanya final.
 * - `skipped`    : Core sengaja tidak dikonfigurasi (dev) / xpGained <= 0.
 * - `failed`     : Core unreachable / non-2xx — kandidat retry (PENDING).
 */
export type AwardLmsXpResult =
  | { status: 'synced'; idempotent: boolean; user: CoreAwardXpResponse['user'] }
  | { status: 'skipped'; reason: 'not_configured' | 'zero_xp' }
  | { status: 'failed'; reason: 'unreachable' | 'http_error'; httpStatus?: number };

/** True jika XP sudah pasti tercermin di Core (baru atau replay idempoten). */
export function isCoreXpSynced(result: AwardLmsXpResult): boolean {
  return result.status === 'synced';
}

/** Map hasil award Core → status outbox lokal (LmsCoreSyncStatus). */
export function coreResultToSyncStatus(
  result: AwardLmsXpResult,
): 'SYNCED' | 'SKIPPED' | 'PENDING' {
  if (result.status === 'synced') return 'SYNCED';
  if (result.status === 'skipped') return 'SKIPPED';
  return 'PENDING';
}

export { isCoreAwardConfigured };

export async function awardLmsXp(input: AwardLmsXpInput): Promise<AwardLmsXpResult> {
  if (input.xpGained <= 0) {
    return { status: 'skipped', reason: 'zero_xp' };
  }
  if (!isCoreAwardConfigured()) {
    coreLog.debug(
      { userId: input.userId, kind: input.kind, xpGained: input.xpGained },
      'Core XP award skipped (not configured)',
    );
    return { status: 'skipped', reason: 'not_configured' };
  }

  const baseUrl = getCoreApiBaseUrl();
  const serviceToken = getCoreServiceToken();
  if (!baseUrl || !serviceToken) return { status: 'skipped', reason: 'not_configured' };

  const idempotencyKey =
    input.idempotencyKey ??
    buildLmsIdempotencyKey(
      input.kind,
      input.userId,
      input.sourceRefId ?? undefined,
    );

  const activityType = toCoreActivityType(input.kind);
  const started = Date.now();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/gamification/award`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceToken}`,
      },
      body: JSON.stringify({
        userId: input.userId,
        application: CORE_APPLICATION_LMS,
        activityType,
        xpGained: input.xpGained,
        sourceRefId: input.sourceRefId,
        idempotencyKey,
      }),
      cache: 'no-store',
    });
  } catch (error) {
    // Network/DNS/timeout — Core unreachable. Retryable, never throw.
    const durationMs = Date.now() - started;
    coreLog.warn(
      {
        userId: input.userId,
        kind: input.kind,
        activityType,
        xpGained: input.xpGained,
        idempotencyKey,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      },
      'Core gamification award unreachable',
    );
    return { status: 'failed', reason: 'unreachable' };
  }

  const durationMs = Date.now() - started;

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const failure = logUpstreamFailure(
      {
        method: 'POST',
        path: '/api/v1/gamification/award',
        statusCode: response.status,
        durationMs,
        responseBody: body,
      },
      'Core gamification award request failed',
    );
    coreLog.warn(
      {
        ...failure.context,
        userId: input.userId,
        kind: input.kind,
        activityType,
        xpGained: input.xpGained,
        idempotencyKey,
      },
      failure.summary,
    );
    return { status: 'failed', reason: 'http_error', httpStatus: response.status };
  }

  const result = (await response.json()) as CoreAwardXpResponse;
  const success = logUpstreamFailure(
    {
      method: 'POST',
      path: '/api/v1/gamification/award',
      statusCode: response.status,
      durationMs,
    },
    'Core gamification XP awarded',
  );
  coreLog.info(
    {
      ...success.context,
      userId: input.userId,
      kind: input.kind,
      activityType,
      xpGained: input.xpGained,
      idempotencyKey,
      idempotent: result.idempotent,
      totalXp: result.user.totalXp,
    },
    success.summary,
  );
  return { status: 'synced', idempotent: result.idempotent, user: result.user };
}
