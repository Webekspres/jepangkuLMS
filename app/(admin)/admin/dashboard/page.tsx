import { AdminDashboardPage } from '@/features/admin-cms/components/admin-dashboard-page';
import { loadAdminDashboardStats } from '@/features/admin-cms/lib/load-admin-dashboard-stats';
import { loadAdminAnalyticsConfig } from '@/features/admin-cms/lib/load-admin-analytics-config';

export default async function AdminDashboardRoute() {
  const [stats, analyticsConfig] = await Promise.all([
    loadAdminDashboardStats(),
    Promise.resolve(loadAdminAnalyticsConfig()),
  ]);
  return <AdminDashboardPage stats={stats} analyticsConfig={analyticsConfig} />;
}
