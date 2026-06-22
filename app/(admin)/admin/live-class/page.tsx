import { AdminLiveClassesPage } from '@/features/admin-cms/components/admin-live-classes-page';
import { loadAdminLiveClasses } from '@/features/admin-cms/lib/load-admin-live-classes';

export default async function AdminLiveClassRoutePage() {
  const classes = await loadAdminLiveClasses();
  return <AdminLiveClassesPage classes={classes} />;
}
