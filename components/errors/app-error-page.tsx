'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppStatusPage } from '@/components/errors/app-status-page';

type AppErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
  title?: string;
};

export function AppErrorPage({
  error,
  reset,
  homeHref = '/',
  title = 'Terjadi kesalahan',
}: AppErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isGateway =
    error.message.includes('fetch failed') ||
    error.message.includes('timeout') ||
    error.message.includes('Connection terminated') ||
    error.message.includes('ngrok');

  return (
    <AppStatusPage
      code="!"
      title={isGateway ? 'Koneksi terputus' : title}
      description={
        isGateway
          ? 'Server atau database sempat tidak merespons. Pastikan layanan berjalan lalu coba lagi.'
          : 'Maaf, ada gangguan saat memuat halaman ini. Tim kami sudah mendapat log error.'
      }
      action={
        <>
          <Button onClick={reset}>Coba lagi</Button>
          <Button asChild variant="outline">
            <Link href={homeHref}>Kembali</Link>
          </Button>
        </>
      }
    />
  );
}
