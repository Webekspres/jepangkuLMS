import { AdminBadgesPage } from '@/features/admin-cms/components/admin-badges-page';
import { loadAdminBadges } from '@/features/admin-cms/lib/load-admin-badges';
import { isR2Configured } from '@/lib/r2';

export default async function AdminBadgesRoutePage() {
  const badges = await loadAdminBadges();
  return <AdminBadgesPage badges={badges} r2Configured={isR2Configured()} />;
}
