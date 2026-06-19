import Link from 'next/link';
import { BookOpen, Clock, Users } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminStatCard } from '@/features/admin-cms/components/admin-stat-card';
import type { AdminDashboardStats } from '@/features/admin-cms/lib/load-admin-dashboard-stats';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';

export function AdminDashboardPage({ stats }: { stats: AdminDashboardStats }) {
  return (
    <AdminPageShell
      label="Admin"
      title="Dashboard"
      subtitle="Overview statistik JepangKu LMS — siswa, kursus, dan antrean pembayaran."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          title="Total Siswa"
          value={formatDisplayNumber(stats.studentCount)}
          description="Akun terdaftar di LMS"
          icon={Users}
        />
        <AdminStatCard
          title="Total Kursus"
          value={formatDisplayNumber(stats.courseCount)}
          description="Paket kursus di database"
          icon={BookOpen}
          accentClassName="bg-brand-orange/10 text-brand-orange"
        />
        <AdminStatCard
          title="Pembayaran Pending"
          value={formatDisplayNumber(stats.pendingEnrollments)}
          description="Enrollment menunggu verifikasi"
          icon={Clock}
          accentClassName="bg-brand-yellow/10 text-yellow-600 dark:text-brand-yellow"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Aksi Cepat</CardTitle>
            <CardDescription>Shortcut ke modul CMS yang sering dipakai.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="default">
              <Link href={ADMIN_ROUTES.kursusForm}>Buat Kursus</Link>
            </Button>
            <Button asChild variant="outline" className="border-border">
              <Link href={ADMIN_ROUTES.kursus}>Kelola Kursus</Link>
            </Button>
            <Button asChild variant="outline" className="border-border">
              <Link href={ADMIN_ROUTES.pembayaran}>Verifikasi Pembayaran</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Status CMS</CardTitle>
            <CardDescription>Kurikulum Course → Modul → Pelajaran siap dikelola.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>✓ CRUD kursus, modul, dan pelajaran</p>
            <p>✓ Layout admin mengikuti pola Jepangku News + token LMS</p>
            <p>→ Berikutnya: editor materi flashcard & bank soal per lesson</p>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
