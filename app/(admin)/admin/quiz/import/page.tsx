import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

/** Import soal global digantikan oleh bank soal per-pelajaran. */
export default function AdminQuizImportPage() {
  redirect(ADMIN_ROUTES.quiz);
}
