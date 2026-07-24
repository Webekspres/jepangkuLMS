import { AdminDashboardPage } from '@/features/admin-cms/components/admin-dashboard-page';
import {
  loadAdminDashboardInsights,
  parseDashboardRangeDays,
} from '@/features/admin-cms/lib/load-admin-dashboard-insights';

type AdminDashboardRouteProps = {
  searchParams: Promise<{ range?: string }>;
};

export default async function AdminDashboardRoute({ searchParams }: AdminDashboardRouteProps) {
  const { range } = await searchParams;
  const rangeDays = parseDashboardRangeDays(range);
  const insights = await loadAdminDashboardInsights(rangeDays);
  return <AdminDashboardPage insights={insights} />;
}
