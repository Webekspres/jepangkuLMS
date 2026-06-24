import { auth, currentUser } from '@clerk/nextjs/server';
import { syncUserAnchor } from '@/lib/auth/sync-user-anchor';
import { resolveClerkIdentity } from '@/features/auth/lib/clerk-user-display';
import { AdminShell } from '@/features/admin-cms/components/admin-shell';
import { getPendingEnrollmentCount } from '@/lib/lms/notifications';
import { loadResolvedLmsProfilePresentation } from '@/lib/lms/user-profile';

/** Admin area shell — sidebar CMS + konten utama. */
export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (userId) {
    await syncUserAnchor(userId).catch(() => undefined);
  }

  const pendingEnrollmentCount = await getPendingEnrollmentCount();

  let sessionProfile: Awaited<ReturnType<typeof loadResolvedLmsProfilePresentation>> | null =
    null;
  if (userId) {
    const clerkUser = await currentUser();
    const identity = resolveClerkIdentity(clerkUser);
    sessionProfile = await loadResolvedLmsProfilePresentation(userId, {
      displayName: identity?.displayName ?? null,
      imageUrl: identity?.imageUrl ?? null,
    });
  }

  return (
    <AdminShell pendingEnrollmentCount={pendingEnrollmentCount} sessionProfile={sessionProfile}>
      {children}
    </AdminShell>
  );
}
