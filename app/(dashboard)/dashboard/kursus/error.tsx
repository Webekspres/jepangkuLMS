'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export default function KursusError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard kursus error:', error);
  }, [error]);

  const isGateway =
    error.message.includes('ngrok') ||
    error.message.includes('ERR_NGROK') ||
    error.message.includes('fetch failed');

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold text-foreground">
        {isGateway ? 'Koneksi terputus' : 'Gagal memuat kursus'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isGateway
          ? 'Tunnel ngrok atau server dev sempat timeout. Coba muat ulang — request berikutnya biasanya lebih cepat setelah compile selesai.'
          : 'Terjadi kesalahan saat mengambil data kursus dari database.'}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button onClick={reset}>Coba lagi</Button>
        <Button asChild variant="outline">
          <Link href={STUDENT_ROUTES.home}>Ke beranda</Link>
        </Button>
      </div>
    </div>
  );
}
