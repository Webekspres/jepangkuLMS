import { AdminTryoutSessionsPage } from '@/features/admin-cms/components/admin-tryout-sessions-page';
import { loadAdminTryoutSessions } from '@/features/admin-cms/lib/load-admin-tryout-sessions';

export default async function AdminTryoutRoutePage() {
  const sessions = await loadAdminTryoutSessions();
  return <AdminTryoutSessionsPage sessions={sessions} />;
}
