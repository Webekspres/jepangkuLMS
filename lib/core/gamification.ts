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
    currentPoints: number;
    currentLevel: number;
  };
};

export type AwardLmsXpInput = {
  userId: string;
  kind: LmsActivityKind;
  xpGained: number;
  pointsGained?: number;
  sourceRefId?: string;
  idempotencyKey?: string;
};

export { isCoreAwardConfigured };

export async function awardLmsXp(input: AwardLmsXpInput): Promise<CoreAwardXpResponse | null> {
  if (!isCoreAwardConfigured() || input.xpGained <= 0) {
    coreLog.debug(
      { userId: input.userId, kind: input.kind, xpGained: input.xpGained },
      'Core XP award skipped (not configured or zero XP)',
    );
    return null;
  }

  const baseUrl = getCoreApiBaseUrl();
  const serviceToken = getCoreServiceToken();
  if (!baseUrl || !serviceToken) return null;

  const idempotencyKey =
    input.idempotencyKey ??
    buildLmsIdempotencyKey(
      input.kind,
      input.userId,
      input.sourceRefId ?? undefined,
    );

  const activityType = toCoreActivityType(input.kind);
  const started = Date.now();

  const response = await fetch(`${baseUrl}/api/v1/gamification/award`, {
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
      pointsGained: input.pointsGained ?? input.xpGained,
      sourceRefId: input.sourceRefId,
      idempotencyKey,
    }),
    cache: 'no-store',
  });

  const durationMs = Date.now() - started;

  if (!response.ok) {
    const body = await response.text();
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
    return null;
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
  return result;
}
