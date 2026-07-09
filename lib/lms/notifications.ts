import type { LmsNotificationType } from '@prisma/client';
import { createClerkClient } from '@clerk/nextjs/server';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
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
    href: STUDENT_ROUTES.achievements,
    dedupeKey: `badge-unlock:${input.userId}:${input.badgeId}`,
  });
}

export async function notifyLiveClassRegistration(input: {
  studentUserId: string;
  liveClassTitle: string;
  priceIdr: number;
}): Promise<void> {
  await createLmsNotification({
    userId: input.studentUserId,
    type: 'ENROLLMENT_PENDING',
    title: 'Pendaftaran Live Class Berhasil',
    body: `Pendaftaran Anda di "${input.liveClassTitle}" telah diterima dan menunggu verifikasi pembayaran.`,
    href: '/dashboard/live-class',
  });

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUser = await clerk.users.getUser(input.studentUserId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? 'unknown@example.com';
    
    console.log(`[EMAIL MOCK] Mengirim email konfirmasi pendaftaran:
      To: ${email}
      Subject: Pendaftaran Live Class - JepangKu LMS
      Body: Halo ${clerkUser.firstName ?? 'Siswa'}, pendaftaran Anda untuk kelas "${input.liveClassTitle}" seharga Rp ${input.priceIdr.toLocaleString('id-ID')} telah kami terima.
      Silakan selesaikan pembayaran dan konfirmasi via WhatsApp.`);
  } catch (error) {
    console.error('[EMAIL MOCK ERROR] Gagal mengambil email dari Clerk untuk registration:', error);
  }
}

export async function notifyLiveClassApproval(input: {
  studentUserId: string;
  liveClassTitle: string;
}): Promise<void> {
  await createLmsNotification({
    userId: input.studentUserId,
    type: 'ENROLLMENT_APPROVED',
    title: 'Akses Live Class Aktif',
    body: `Pendaftaran Anda di "${input.liveClassTitle}" sudah disetujui! Silakan cek jadwal pertemuan di dasbor.`,
    href: '/dashboard/live-class',
  });

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUser = await clerk.users.getUser(input.studentUserId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? 'unknown@example.com';
    
    console.log(`[EMAIL MOCK] Mengirim email persetujuan pendaftaran:
      To: ${email}
      Subject: Kelas Live Aktif - JepangKu LMS
      Body: Halo ${clerkUser.firstName ?? 'Siswa'}, pendaftaran Anda untuk kelas "${input.liveClassTitle}" telah disetujui! Anda sekarang dapat mengakses link pertemuan Zoom di halaman detail kelas.`);
  } catch (error) {
    console.error('[EMAIL MOCK ERROR] Gagal mengambil email dari Clerk untuk approval:', error);
  }
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
