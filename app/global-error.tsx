'use client';

import { AppErrorPage } from '@/components/errors/app-error-page';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppErrorPage error={error} reset={reset} title="Aplikasi mengalami gangguan" />
      </body>
    </html>
  );
}
