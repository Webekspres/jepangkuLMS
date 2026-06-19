import { auth } from '@clerk/nextjs/server';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { AdminShell } from '@/features/admin-cms/components/admin-shell';
import { getPendingEnrollmentCount } from '@/lib/lms/notifications';

/** Admin area shell — sidebar CMS + konten utama. */
export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (userId) {
    await syncUserAnchor(userId).catch(() => undefined);
  }

  const pendingEnrollmentCount = await getPendingEnrollmentCount();

  return (
    <AdminShell pendingEnrollmentCount={pendingEnrollmentCount}>{children}</AdminShell>
  );
}
