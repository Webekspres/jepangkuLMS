import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { resolveInitialLmsRole } from '@/lib/auth/lms-roles';
import { resolveClerkIdentity } from '@/features/auth/lib/clerk-user-display';
import { trimSsoDisplayName } from '@/lib/lms/display-name';
import { checkDailyLoginLms, type DailyLoginAward } from '@/lib/lms/points';
import { loggers, serializeError } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

const authLog = loggers.auth;

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;

export type ClerkAnchorProfile = {
  ssoDisplayName?: string | null;
  avatarUrl?: string | null;
  ssoEmail?: string | null;
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
  extra?: Pick<
    Prisma.UserCreateInput,
    'displayName' | 'ssoDisplayName' | 'ssoEmail' | 'avatarUrl' | 'bio' | 'phone' | 'displayNameSetupAt' | 'phoneSetupAt'
  >,
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
    ssoEmail: identity.email,
  };
}

async function findCanonicalSsoSibling(
  userId: string,
  ssoDisplayName: string,
) {
  const siblings = await prisma.user.findMany({
    where: { ssoDisplayName, id: { not: userId } },
    orderBy: { createdAt: 'asc' },
    select: {
      displayName: true,
      displayNameSetupAt: true,
      avatarUrl: true,
      bio: true,
      role: true,
    },
  });

  const adminSibling = siblings.find(
    (row) => row.role === 'LMS_ADMIN' && row.displayNameSetupAt,
  );
  if (adminSibling) return adminSibling;

  return siblings.find((row) => row.displayNameSetupAt) ?? null;
}

function inheritedAnchorFields(
  inherited: NonNullable<Awaited<ReturnType<typeof findCanonicalSsoSibling>>>,
  profile?: ClerkAnchorProfile | null,
): Pick<Prisma.UserUpdateInput, 'displayName' | 'displayNameSetupAt' | 'avatarUrl' | 'bio' | 'role'> {
  return {
    displayName: inherited.displayName,
    displayNameSetupAt: inherited.displayNameSetupAt,
    avatarUrl: inherited.avatarUrl ?? profile?.avatarUrl ?? undefined,
    bio: inherited.bio ?? undefined,
    ...(inherited.role === 'LMS_ADMIN' ? { role: 'LMS_ADMIN' as const } : {}),
  };
}

export async function syncUserAnchor(
  userId: string,
  clerkProfile?: ClerkAnchorProfile,
): Promise<{ dailyLoginAward?: DailyLoginAward }> {
  const profile = await resolveClerkAnchorProfile(userId, clerkProfile);
  const ssoDisplayName = trimSsoDisplayName(profile?.ssoDisplayName);
  const ssoEmail = profile?.ssoEmail?.trim() || null;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { ssoDisplayName: true, displayNameSetupAt: true, displayName: true, role: true },
      });

      if (!existing) {
        const inherited = ssoDisplayName
          ? await findCanonicalSsoSibling(userId, ssoDisplayName)
          : null;

        await prisma.user.create({
          data: userAnchorCreateData(userId, {
            ssoDisplayName: ssoDisplayName ?? undefined,
            ssoEmail: ssoEmail ?? undefined,
            avatarUrl: inherited?.avatarUrl ?? profile?.avatarUrl ?? undefined,
            displayName: inherited?.displayName ?? undefined,
            displayNameSetupAt: inherited?.displayNameSetupAt ?? undefined,
            bio: inherited?.bio ?? undefined,
            ...(inherited?.role === 'LMS_ADMIN' ? { role: 'LMS_ADMIN' as const } : {}),
          }),
        });

        if (inherited) {
          authLog.info(
            { userId, inheritedFrom: 'ssoDisplayName', role: inherited.role },
            'Reused LMS profile from prior SSO identity',
          );
        }
      } else {
        const anchorPatch: Prisma.UserUpdateInput = {};

        if (ssoDisplayName && !existing.ssoDisplayName?.trim()) {
          anchorPatch.ssoDisplayName = ssoDisplayName;
        }
        if (ssoEmail) {
          anchorPatch.ssoEmail = ssoEmail;
        }

        if (Object.keys(anchorPatch).length > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: anchorPatch,
          });
        }

        if (ssoDisplayName) {
          const inherited = await findCanonicalSsoSibling(userId, ssoDisplayName);
          const shouldReconcile =
            inherited &&
            (!existing.displayNameSetupAt ||
              (inherited.role === 'LMS_ADMIN' && existing.role !== 'LMS_ADMIN'));

          if (shouldReconcile && inherited) {
            await prisma.user.update({
              where: { id: userId },
              data: inheritedAnchorFields(inherited, profile),
            });
            authLog.info(
              { userId, inheritedFrom: 'ssoDisplayName', role: inherited.role },
              'Reconciled LMS profile from prior SSO identity',
            );
          }
        }
      }

      authLog.info({ userId, attempt }, 'User anchor synced to LMS database');
      const dailyLoginAward = await checkDailyLoginLms(userId).catch((error) => {
        authLog.warn({ userId, ...serializeError(error) }, 'Daily login LMS points skipped');
        return null;
      });
      return { dailyLoginAward: dailyLoginAward ?? undefined };
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
