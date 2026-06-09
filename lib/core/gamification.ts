import { getCoreApiBaseUrl } from './client';
import { CORE_APPLICATION_LMS, getCoreServiceToken, isCoreAwardConfigured } from './config';
import type { LmsActivityKind } from './activity-map';
import { buildLmsIdempotencyKey, toCoreActivityType } from './activity-map';

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
      activityType: toCoreActivityType(input.kind),
      xpGained: input.xpGained,
      pointsGained: input.pointsGained ?? input.xpGained,
      sourceRefId: input.sourceRefId,
      idempotencyKey,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    console.warn('[core/gamification] award failed:', response.status, body);
    return null;
  }

  return (await response.json()) as CoreAwardXpResponse;
}
