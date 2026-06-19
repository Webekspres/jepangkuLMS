import { prisma } from '@/lib/prisma';
import { resolveInitialLmsRole } from '@/lib/auth/lms-roles';
import { checkDailyLoginLms } from '@/lib/lms/points';
import { loggers, serializeError } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

const authLog = loggers.auth;

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;

function isTransientDbError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('timeout') ||
    message.includes('Connection terminated') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT') ||
    message.includes('connection refused')
  );
}

/** Payload create User jangkar — selalu punya role eksplisit (default siswa). */
export function userAnchorCreateData(
  userId: string,
  extra?: Pick<Prisma.UserCreateInput, 'displayName' | 'avatarUrl' | 'bio'>,
): Prisma.UserCreateInput {
  return {
    id: userId,
    role: resolveInitialLmsRole(userId),
    ...extra,
  };
}

/** Upsert baris User jangkar LMS (FK) setelah login — profil tetap dari Core JWT */
export async function syncUserAnchor(userId: string): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await prisma.user.upsert({
        where: { id: userId },
        create: userAnchorCreateData(userId),
        update: {},
      });
      authLog.info({ userId, attempt }, 'User anchor synced to LMS database');
      await checkDailyLoginLms(userId).catch((error) => {
        authLog.warn({ userId, ...serializeError(error) }, 'Daily login LMS points skipped');
      });
      return;
    } catch (error) {
      lastError = error;
      const retry = attempt < MAX_ATTEMPTS && isTransientDbError(error);
      authLog.warn(
        { userId, attempt, retry, ...serializeError(error) },
        retry ? 'User anchor sync failed — retrying' : 'User anchor sync failed',
      );
      if (!retry) break;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }

  authLog.error({ userId, ...serializeError(lastError) }, 'User anchor sync exhausted retries');
  throw lastError;
}
