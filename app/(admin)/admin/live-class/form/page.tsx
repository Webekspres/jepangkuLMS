import { AdminLiveClassFormPage } from '@/features/admin-cms/components/admin-live-class-form';
import { loadAdminLiveClassById } from '@/features/admin-cms/lib/load-admin-live-classes';

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AdminLiveClassFormRoutePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id?.trim();
  const liveClass = id ? await loadAdminLiveClassById(id) : null;
  return <AdminLiveClassFormPage liveClass={liveClass ?? undefined} />;
}
