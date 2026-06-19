import { AdminShell } from '@/features/admin-cms/components/admin-shell';

/** Admin area shell — sidebar CMS + konten utama. */
export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
