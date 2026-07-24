import Link from 'next/link';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardQuickActions() {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold">Aksi cepat</CardTitle>
        <CardDescription>Shortcut ke modul CMS yang sering dipakai.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild variant="default">
          <Link href={ADMIN_ROUTES.kursusForm}>Buat Kursus</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link href={ADMIN_ROUTES.pembayaran}>Verifikasi Pembayaran</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link href={ADMIN_ROUTES.kursusImport}>Import Kursus</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link href={ADMIN_ROUTES.liveClassForm}>Jadwalkan Live Class</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link href={ADMIN_ROUTES.tryoutSessionForm}>Buat Sesi Tryout</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link href={ADMIN_ROUTES.tryoutPaket}>Paket Tryout</Link>
        </Button>
        <Button asChild variant="outline" className="border-border">
          <Link href={ADMIN_ROUTES.badges}>Kelola Badge</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
