import { AdminBadgeGrantPage } from '@/features/admin-cms/components/admin-badge-grant-page';
import { loadAdminGrantBadgeOptions } from '@/features/admin-cms/lib/load-admin-badge-grants';

export default async function AdminBadgeGrantRoutePage() {
  const badges = await loadAdminGrantBadgeOptions();
  return <AdminBadgeGrantPage badges={badges} />;
}
