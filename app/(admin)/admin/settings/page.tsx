import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminAnalyticsPanel } from '@/features/admin-cms/components/admin-analytics-panel';
import { loadAdminAnalyticsConfig } from '@/features/admin-cms/lib/load-admin-analytics-config';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

export default function AdminSettingsPage() {
  const analyticsConfig = loadAdminAnalyticsConfig();

  return (
    <AdminPageShell
      label="Admin"
      title="Pengaturan"
      subtitle="Integrasi analytics, SEO, dan konfigurasi operasional CMS."
      backHref={ADMIN_ROUTES.dashboard}
      backLabel="Dashboard"
    >
      <AdminAnalyticsPanel config={analyticsConfig} />
    </AdminPageShell>
  );
}
