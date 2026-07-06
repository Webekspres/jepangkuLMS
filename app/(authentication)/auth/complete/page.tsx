import { redirect } from 'next/navigation';
import { AUTH_ROUTES } from '@/lib/auth/constants';

/** Legacy URL — Core sync sekarang background; langsung ke dashboard. */
export default function AuthCompleteRoute() {
  redirect(AUTH_ROUTES.dashboard);
}
