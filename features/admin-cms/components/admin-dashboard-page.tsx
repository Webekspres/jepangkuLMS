import Link from 'next/link';
import { BookOpen, Clock, GraduationCap, Target, Users, Video } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminStatCard } from '@/features/admin-cms/components/admin-stat-card';
import type { AdminDashboardStats } from '@/features/admin-cms/lib/load-admin-dashboard-stats';
import type { AdminAnalyticsConfig } from '@/features/admin-cms/lib/load-admin-analytics-config';
import { AdminAnalyticsPanel } from '@/features/admin-cms/components/admin-analytics-panel';
import { EnrollmentTrendChart } from '@/features/admin-cms/components/enrollment-trend-chart';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';

export function AdminDashboardPage({
  stats,
  analyticsConfig,
}: {
  stats: AdminDashboardStats;
  analyticsConfig: AdminAnalyticsConfig;
}) {
  const approvalRate =
    stats.totalEnrollments > 0
      ? Math.round((stats.activeEnrollments / stats.totalEnrollments) * 100)
      : 0;

  return (
    <AdminPageShell
      label="Admin"
      title="Dashboard"
      subtitle="Overview statistik JepangKu LMS — siswa, kursus, program, dan aktivitas belajar."
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
          accentClassName="bg-brand-yellow/10 text-yellow-600 "
        />
        <AdminStatCard
          title="Enrollment Aktif"
          value={formatDisplayNumber(stats.activeEnrollments)}
          description={`${approvalRate}% dari total enrollment`}
          icon={GraduationCap}
          accentClassName="bg-emerald-500/10 text-emerald-600 "
        />
        <AdminStatCard
          title="Live Class"
          value={formatDisplayNumber(stats.upcomingLiveClasses)}
          description={`${stats.publishedLiveClasses} terpublikasi · ${stats.upcomingLiveClasses} mendatang`}
          icon={Video}
          accentClassName="bg-blue-500/10 text-blue-600 "
        />
        <AdminStatCard
          title="Sesi Tryout"
          value={formatDisplayNumber(stats.activeTryoutSessions)}
          description={`${stats.quizAttemptsThisWeek} attempt kuis minggu ini`}
          icon={Target}
          accentClassName="bg-violet-500/10 text-violet-600 "
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Enrollment (7 hari)</CardTitle>
            <CardDescription>Pendaftaran baru per hari minggu ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnrollmentTrendChart data={stats.enrollmentTrend} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Ringkasan Program</CardTitle>
            <CardDescription>Status live class dan simulasi JLPT.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: 'Live class mendatang',
                value: stats.upcomingLiveClasses,
                href: ADMIN_ROUTES.liveClass,
              },
              {
                label: 'Sesi tryout aktif',
                value: stats.activeTryoutSessions,
                href: ADMIN_ROUTES.tryoutSessions,
              },
              {
                label: 'Attempt kuis (7 hari)',
                value: stats.quizAttemptsThisWeek,
                href: ADMIN_ROUTES.kursus,
              },
            ].map((row) => (
              <Link
                key={row.label}
                href={row.href}
                className={cn(
                  'flex items-center justify-between rounded-xl border border-border px-4 py-3',
                  'transition-colors hover:bg-muted/40',
                )}
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-lg font-bold text-foreground">{row.value}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <AdminAnalyticsPanel config={analyticsConfig} />
      </div>

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Aksi Cepat</CardTitle>
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
            <Link href={ADMIN_ROUTES.liveClassForm}>Jadwalkan Live Class</Link>
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href={ADMIN_ROUTES.tryoutSessionForm}>Buat Sesi Tryout</Link>
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href={ADMIN_ROUTES.kursus}>Kelola Kursus</Link>
          </Button>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
