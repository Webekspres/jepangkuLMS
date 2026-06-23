import { AdminTryoutSessionFormPage } from '@/features/admin-cms/components/admin-tryout-session-form';
import { loadAdminTryoutSessionById } from '@/features/admin-cms/lib/load-admin-tryout-sessions';

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AdminTryoutFormRoutePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id?.trim();
  const session = id ? await loadAdminTryoutSessionById(id) : null;
  return <AdminTryoutSessionFormPage session={session ?? undefined} />;
}
