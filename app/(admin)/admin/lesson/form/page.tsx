import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

export default function AdminLessonFormRedirectPage() {
  redirect(ADMIN_ROUTES.kursus);
}
