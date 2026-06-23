import Link from 'next/link';
import { AppStatusPage } from '@/components/errors/app-status-page';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <AppStatusPage
      code="404"
      title="Halaman tidak ditemukan"
      description="URL yang kamu buka tidak ada, sudah dipindah, atau memang belum tersedia di JepangKu LMS."
      action={
        <>
          <Button asChild>
            <Link href="/">Ke Beranda</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/kursus">Lihat Kursus</Link>
          </Button>
        </>
      }
    />
  );
}
