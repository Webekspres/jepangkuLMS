'use client';

import { AppErrorPage } from '@/components/errors/app-error-page';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export default function StudentError({
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
      homeHref={STUDENT_ROUTES.home}
      title="Gagal memuat halaman belajar"
    />
  );
}
