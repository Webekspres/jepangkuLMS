import type { LmsNotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type CreateLmsNotificationInput = {
  userId: string;
  type: LmsNotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  dedupeKey?: string | null;
};

export async function createLmsNotification(
  input: CreateLmsNotificationInput,
): Promise<boolean> {
  try {
    await prisma.lmsNotification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        dedupeKey: input.dedupeKey ?? null,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function notifyAllLmsAdmins(
  input: Omit<CreateLmsNotificationInput, 'userId'>,
): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: 'LMS_ADMIN' },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createLmsNotification({
        ...input,
        userId: admin.id,
        dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${admin.id}` : null,
      }),
    ),
  );
}

export async function notifyEnrollmentPending(input: {
  enrollmentId: string;
  studentUserId: string;
  studentName: string;
  courseTitle: string;
}): Promise<void> {
  await notifyAllLmsAdmins({
    type: 'ENROLLMENT_PENDING',
    title: 'Enrollment baru menunggu verifikasi',
    body: `${input.studentName} mendaftar kursus ${input.courseTitle}.`,
    href: '/admin/pembayaran',
    dedupeKey: `enrollment-pending:${input.enrollmentId}`,
  });
}

export async function notifyEnrollmentApproved(input: {
  enrollmentId: string;
  studentUserId: string;
  courseTitle: string;
  courseSlug: string;
}): Promise<void> {
  await createLmsNotification({
    userId: input.studentUserId,
    type: 'ENROLLMENT_APPROVED',
    title: 'Enrollment disetujui',
    body: `Akses kursus ${input.courseTitle} sudah aktif. Selamat belajar!`,
    href: `/dashboard/kursus/${input.courseSlug}`,
    dedupeKey: `enrollment-approved:${input.enrollmentId}`,
  });
}

export async function notifyEnrollmentRejected(input: {
  enrollmentId: string;
  studentUserId: string;
  courseTitle: string;
}): Promise<void> {
  await createLmsNotification({
    userId: input.studentUserId,
    type: 'ENROLLMENT_REJECTED',
    title: 'Enrollment ditolak',
    body: `Permintaan enrollment kursus ${input.courseTitle} tidak disetujui.`,
    href: '/dashboard/kursus',
    dedupeKey: `enrollment-rejected:${input.enrollmentId}`,
  });
}

export async function notifyCourseGranted(input: {
  studentUserId: string;
  courseTitle: string;
  courseSlug: string;
  courseId: string;
}): Promise<void> {
  await createLmsNotification({
    userId: input.studentUserId,
    type: 'COURSE_GRANTED',
    title: 'Akses kursus diberikan',
    body: `Admin memberikan akses ke kursus ${input.courseTitle}.`,
    href: `/dashboard/kursus/${input.courseSlug}`,
    dedupeKey: `course-granted:${input.studentUserId}:${input.courseId}`,
  });
}

export async function notifyBadgeUnlocked(input: {
  userId: string;
  badgeId: string;
  badgeTitle: string;
  xpBonus: number;
}): Promise<void> {
  await createLmsNotification({
    userId: input.userId,
    type: 'BADGE_UNLOCKED',
    title: 'Badge baru diraih!',
    body:
      input.xpBonus > 0
        ? `Kamu mendapatkan badge "${input.badgeTitle}" (+${input.xpBonus} XP).`
        : `Kamu mendapatkan badge "${input.badgeTitle}".`,
    href: '/dashboard/pencapaian',
    dedupeKey: `badge-unlock:${input.userId}:${input.badgeId}`,
  });
}

export async function getPendingEnrollmentCount(): Promise<number> {
  return prisma.enrollment.count({ where: { status: 'PENDING' } });
}

export type LmsNotificationView = {
  id: string;
  type: LmsNotificationType;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export async function loadUserNotifications(
  userId: string,
  limit = 20,
): Promise<LmsNotificationView[]> {
  return prisma.lmsNotification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.lmsNotification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const result = await prisma.lmsNotification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.lmsNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function dismissNotification(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const result = await prisma.lmsNotification.deleteMany({
    where: { id: notificationId, userId },
  });
  return result.count > 0;
}

/** Hapus semua notifikasi yang sudah dibaca milik user. */
export async function deleteReadNotifications(userId: string): Promise<number> {
  const result = await prisma.lmsNotification.deleteMany({
    where: { userId, readAt: { not: null } },
  });
  return result.count;
}
