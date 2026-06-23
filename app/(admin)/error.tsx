'use client';

import { AppErrorPage } from '@/components/errors/app-error-page';
import { ADMIN_ROUTES } from '@/lib/auth/constants';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppErrorPage
      error={error}
      reset={reset}
      homeHref={ADMIN_ROUTES.dashboard}
      title="Gagal memuat halaman admin"
    />
  );
}
