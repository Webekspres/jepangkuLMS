import { AdminUsersPage } from '@/features/admin-cms/components/admin-users-page';
import { loadAdminUsers } from '@/features/admin-cms/lib/load-admin-users';

export default async function AdminUsersRoutePage() {
  const users = await loadAdminUsers();
  return <AdminUsersPage users={users} />;
}
