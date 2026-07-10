import { redirect } from 'next/navigation';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

/** Bank menu retired — authoring lives inside Paket Soal. */
export default function AdminTryoutBankRoutePage() {
  redirect(ADMIN_ROUTES.tryoutPaket);
}
