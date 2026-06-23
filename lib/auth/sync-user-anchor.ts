import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { resolveInitialLmsRole } from '@/lib/auth/lms-roles';
import { resolveClerkIdentity } from '@/features/auth/lib/clerk-user-display';
import { trimSsoDisplayName } from '@/lib/lms/display-name';
import { checkDailyLoginLms } from '@/lib/lms/points';
import { loggers, serializeError } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

const authLog = loggers.auth;

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;

export type ClerkAnchorProfile = {
  ssoDisplayName?: string | null;
  avatarUrl?: string | null;
};

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
  extra?: Pick<Prisma.UserCreateInput, 'displayName' | 'ssoDisplayName' | 'avatarUrl' | 'bio'>,
): Prisma.UserCreateInput {
  return {
    id: userId,
    role: resolveInitialLmsRole(userId),
    ...extra,
  };
}

async function resolveClerkAnchorProfile(
  userId: string,
  provided?: ClerkAnchorProfile,
): Promise<ClerkAnchorProfile | null> {
  if (provided) return provided;

  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== userId) return null;

  const identity = resolveClerkIdentity(clerkUser);
  if (!identity) return null;

  return {
    ssoDisplayName: identity.displayName,
    avatarUrl: identity.imageUrl,
  };
}

/** Upsert baris User jangkar LMS (FK) setelah login — simpan nama SSO untuk fallback. */
export async function syncUserAnchor(
  userId: string,
  clerkProfile?: ClerkAnchorProfile,
): Promise<void> {
  const profile = await resolveClerkAnchorProfile(userId, clerkProfile);
  const ssoDisplayName = trimSsoDisplayName(profile?.ssoDisplayName);

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { ssoDisplayName: true },
      });

      if (!existing) {
        await prisma.user.create({
          data: userAnchorCreateData(userId, {
            ssoDisplayName: ssoDisplayName ?? undefined,
            avatarUrl: profile?.avatarUrl ?? undefined,
          }),
        });
      } else if (ssoDisplayName && !existing.ssoDisplayName?.trim()) {
        await prisma.user.update({
          where: { id: userId },
          data: { ssoDisplayName },
        });
      }

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
