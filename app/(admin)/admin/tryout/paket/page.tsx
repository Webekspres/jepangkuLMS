import { AdminJlptPaketPage } from '@/features/admin-cms/components/admin-jlpt-paket-page';
import { loadAdminJlptQuestionSets } from '@/features/admin-cms/lib/load-admin-jlpt-question-sets';

export default async function AdminTryoutPaketRoutePage() {
  const sets = await loadAdminJlptQuestionSets();
  return <AdminJlptPaketPage sets={sets} />;
}
