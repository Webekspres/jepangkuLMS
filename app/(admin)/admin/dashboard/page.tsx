import { AdminDashboardPage } from '@/features/admin-cms/components/admin-dashboard-page';
import { loadAdminDashboardStats } from '@/features/admin-cms/lib/load-admin-dashboard-stats';

export default async function AdminDashboardRoute() {
  const stats = await loadAdminDashboardStats();
  return <AdminDashboardPage stats={stats} />;
}
