import { fetchClerkPrimaryEmail } from '@/lib/auth/clerk-user-email';
import { resolveLmsDisplayName } from '@/lib/lms/user-profile';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { dispatchEnrollmentActivatedEmail } from '@/lib/email/send-enrollment-activated-email';

const emailLog = createLogger('email');

export type EnrollmentActivatedProductKind = 'COURSE' | 'LIVE_CLASS' | 'TRYOUT';

const KIND_LABEL: Record<EnrollmentActivatedProductKind, string> = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'JLPT Tryout',
};

/** Resolve student email for transactional mail: LMS ssoEmail → Clerk. */
export async function resolveStudentEmailForMail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ssoEmail: true },
  });
  const fromDb = user?.ssoEmail?.trim();
  if (fromDb) return fromDb;
  return fetchClerkPrimaryEmail(userId);
}

/**
 * Resolve recipient + dispatch enrollment-activated email (non-blocking).
 * Skips quietly when no email is available.
 */
export async function dispatchEnrollmentActivatedEmailForUser(input: {
  studentUserId: string;
  enrollmentId: string;
  productTitle: string;
  href: string;
  productKind: EnrollmentActivatedProductKind;
  ctaLabel?: string;
}): Promise<void> {
  try {
    const email = await resolveStudentEmailForMail(input.studentUserId);
    if (!email) {
      emailLog.warn(
        { userId: input.studentUserId, enrollmentId: input.enrollmentId },
        'Skip enrollment activated email — no student email',
      );
      return;
    }

    const name = await resolveLmsDisplayName(input.studentUserId, null);
    dispatchEnrollmentActivatedEmail({
      email,
      name,
      enrollmentId: input.enrollmentId,
      productTitle: input.productTitle,
      productKindLabel: KIND_LABEL[input.productKind],
      href: input.href,
      ctaLabel: input.ctaLabel,
    });
  } catch (error) {
    emailLog.warn(
      {
        userId: input.studentUserId,
        enrollmentId: input.enrollmentId,
        error: error instanceof Error ? error.message : error,
      },
      'dispatchEnrollmentActivatedEmailForUser failed (non-fatal)',
    );
  }
}
