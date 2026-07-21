import { redirect } from 'next/navigation';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

/** Hub lama dihapus — bookmark `/dashboard/kana` diarahkan ke Hiragana. */
export default function KanaIndexPage() {
  redirect(STUDENT_ROUTES.kanaScript('hiragana'));
}
