'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import {
  deleteReadNotifications,
  dismissNotification,
  loadUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/lms/notifications';

export type NotificationActionResult =
  | { ok: true }
  | { ok: false; message: string };

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

export async function fetchNotificationsAction() {
  const userId = await requireUserId();
  return loadUserNotifications(userId, 25);
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<NotificationActionResult> {
  try {
    const userId = await requireUserId();
    const ok = await markNotificationRead(userId, notificationId);
    if (!ok) return { ok: false, message: 'Notifikasi tidak ditemukan.' };
    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false, message: 'Gagal memperbarui notifikasi.' };
  }
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  try {
    const userId = await requireUserId();
    await markAllNotificationsRead(userId);
    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false, message: 'Gagal menandai semua notifikasi.' };
  }
}

export async function dismissNotificationAction(
  notificationId: string,
): Promise<NotificationActionResult> {
  try {
    const userId = await requireUserId();
    const ok = await dismissNotification(userId, notificationId);
    if (!ok) return { ok: false, message: 'Notifikasi tidak ditemukan.' };
    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false, message: 'Gagal menghapus notifikasi.' };
  }
}

export async function deleteReadNotificationsAction(): Promise<NotificationActionResult> {
  try {
    const userId = await requireUserId();
    await deleteReadNotifications(userId);
    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false, message: 'Gagal menghapus notifikasi.' };
  }
}
