'use client';

import { AppErrorPage } from '@/components/errors/app-error-page';

export default function MarketingError({
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
      homeHref="/"
      title="Gagal memuat halaman"
    />
  );
}
