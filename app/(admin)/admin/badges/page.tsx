import { AdminBadgesPage } from '@/features/admin-cms/components/admin-badges-page';
import { loadAdminBadges, loadAdminBadgeUnlockHistory } from '@/features/admin-cms/lib/load-admin-badges';
import { isR2Configured } from '@/lib/r2';

export default async function AdminBadgesRoutePage() {
  const [badges, unlocks] = await Promise.all([
    loadAdminBadges(),
    loadAdminBadgeUnlockHistory(),
  ]);
  return <AdminBadgesPage badges={badges} unlocks={unlocks} r2Configured={isR2Configured()} />;
}
